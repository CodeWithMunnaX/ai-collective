import { auth } from "@clerk/nextjs/server"
import { and, asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { chats } from "@/lib/db/schema"

export type ChatDetail = {
  id: string
  title: string
  // The chat's first bot. Group chats are represented by it for now.
  bot: {
    id: string
    name: string
    avatar: string
    job: string
    instruction: string | null
  }
}

// A single chat owned by the signed-in user, or null if it doesn't exist or
// belongs to someone else.
export async function getChat(chatId: string): Promise<ChatDetail | null> {
  const { userId } = await auth()
  if (!userId) return null

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    with: {
      members: {
        orderBy: (members) => asc(members.joinedAt),
        limit: 1,
        with: {
          bot: {
            columns: {
              id: true,
              name: true,
              avatar: true,
              job: true,
              instruction: true,
              userId: true,
            },
          },
        },
      },
    },
  })

  const bot = chat?.members[0]?.bot
  // Never expose a bot owned by someone else.
  if (!chat || !bot || bot.userId !== userId) return null

  return {
    id: chat.id,
    title: chat.name ?? bot.name,
    bot: {
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      job: bot.job,
      instruction: bot.instruction,
    },
  }
}
