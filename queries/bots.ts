import { auth } from "@clerk/nextjs/server"
import { asc, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { chats } from "@/lib/db/schema"

export type ChatWithBot = {
  id: string
  title: string
  preview: string | null
  lastMessageAt: Date
  // Seed for the chat avatar: the chat's bot.
  avatar: string
}

// The signed-in user's chats, newest activity first. Group chats are
// represented by their first bot for now.
export async function getUserChats(): Promise<ChatWithBot[]> {
  const { userId } = await auth()
  if (!userId) return []

  const rows = await db.query.chats.findMany({
    where: eq(chats.userId, userId),
    orderBy: desc(chats.lastMessageAt),
    with: {
      members: {
        orderBy: (members) => asc(members.joinedAt),
        limit: 1,
        with: {
          bot: { columns: { id: true, name: true, avatar: true, userId: true } },
        },
      },
    },
  })

  return rows.flatMap((chat) => {
    const bot = chat.members[0]?.bot
    // Skip chats without a bot, and never expose a bot owned by someone else.
    if (!bot || bot.userId !== userId) return []
    return {
      id: chat.id,
      title: chat.name ?? bot.name,
      preview: chat.lastMessagePreview,
      lastMessageAt: chat.lastMessageAt,
      avatar: bot.avatar,
    }
  })
}
