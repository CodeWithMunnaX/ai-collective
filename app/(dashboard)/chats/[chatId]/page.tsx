import { notFound } from "next/navigation"

import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import { getChat } from "@/queries/chats"

export default async function ChatPage({
  params,
}: PageProps<"/chats/[chatId]">) {
  const { chatId } = await params
  const chat = await getChat(chatId)
  if (!chat) notFound()

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader title={chat.title} bot={chat.bot} />
      <Chat />
    </div>
  )
}
