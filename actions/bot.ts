"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

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
  try {
    // A new bot comes with its own direct chat, created atomically.
    const bot = await db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({ ...rest, instruction: instruction || null, userId })
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
    return { ok: false, error: "Couldn't create the bot. Try again." }
  }
}
