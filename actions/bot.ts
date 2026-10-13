"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"

import { createSandbox, deleteSandbox } from "@/lib/daytona"
import { db } from "@/lib/db"
import { bots, chatMembers, chats, insertBotSchema } from "@/lib/db/schema"

export type CreateBotResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function createBot(input: unknown): Promise<CreateBotResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: "You need to sign in first." }

  const parsed = insertBotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bot.",
    }
  }

  const { instruction, ...rest } = parsed.data
  let sandboxId: string | undefined
  try {
    // Every bot owns a sandbox. It is created here but never started or used.
    sandboxId = await createSandbox()
    const newSandboxId = sandboxId

    // A new bot comes with its own direct chat, created atomically.
    const bot = await db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({
          ...rest,
          instruction: instruction || null,
          userId,
          sandboxId: newSandboxId,
        })
        .returning({ id: bots.id })

      const [chat] = await tx
        .insert(chats)
        .values({ userId, kind: "direct", lastMessageAt: new Date() })
        .returning({ id: chats.id })

      await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id })
      return bot
    })

    // The chat list lives in the dashboard layout's sidebar, so revalidate the layout.
    revalidatePath("/", "layout")
    return { ok: true, id: bot.id }
  } catch (error) {
    console.error("createBot failed", error)
    // Don't leave an orphaned sandbox behind when the bot wasn't saved.
    if (sandboxId) {
      await deleteSandbox(sandboxId).catch((cleanupError) =>
        console.error("createBot sandbox cleanup failed", cleanupError)
      )
    }
    return { ok: false, error: "Couldn't create the bot. Try again." }
  }
}

export type DeleteBotResult = { ok: true } | { ok: false; error: string }

export async function deleteBot(botId: unknown): Promise<DeleteBotResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: "You need to sign in first." }
  if (typeof botId !== "string" || !botId) {
    return { ok: false, error: "Bot not found." }
  }

  try {
    const deleted = await db.transaction(async (tx) => {
      const [bot] = await tx
        .select({ id: bots.id, sandboxId: bots.sandboxId })
        .from(bots)
        .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
      if (!bot) return null

      // Chats have no foreign key to bots, so remove the bot's direct chats
      // explicitly; deleting the bot cascades its memberships.
      const direct = await tx
        .select({ id: chats.id })
        .from(chats)
        .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
        .where(
          and(
            eq(chatMembers.botId, botId),
            eq(chats.userId, userId),
            eq(chats.kind, "direct")
          )
        )
      if (direct.length > 0) {
        await tx.delete(chats).where(
          inArray(
            chats.id,
            direct.map((chat) => chat.id)
          )
        )
      }
      await tx.delete(bots).where(eq(bots.id, botId))
      return bot
    })
    if (!deleted) return { ok: false, error: "Bot not found." }

    // The bot is gone either way; a failed sandbox delete shouldn't undo that.
    if (deleted.sandboxId) {
      await deleteSandbox(deleted.sandboxId).catch((error) =>
        console.error("deleteBot sandbox delete failed", error)
      )
    }

    revalidatePath("/", "layout")
    return { ok: true }
  } catch (error) {
    console.error("deleteBot failed", error)
    return { ok: false, error: "Couldn't delete the bot. Try again." }
  }
}

export type UpdateBotResult ={ ok: true } | { ok: false; error: string }

export async function updateBot(
  botId: string,
  input: unknown
): Promise<UpdateBotResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: "You need to sign in first." }

  const parsed = insertBotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bot.",
    }
  }

  const { instruction, ...rest } = parsed.data
  try {
    const updated = await db
      .update(bots)
      .set({ ...rest, instruction: instruction || null })
      .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
      .returning({ id: bots.id })
    if (updated.length === 0) return { ok: false, error: "Bot not found." }

    revalidatePath("/", "layout")
    return { ok: true }
  } catch (error) {
    console.error("updateBot failed", error)
    return { ok: false, error: "Couldn't save the bot. Try again." }
  }
}
