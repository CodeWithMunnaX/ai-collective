import { notFound } from "next/navigation"

import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import {
  DesktopPanel,
  DesktopPanelProvider,
} from "@/components/desktop-panel"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { getChat } from "@/queries/chats"

export default async function ChatPage({
  params,
}: PageProps<"/chats/[chatId]">) {
  const { chatId } = await params
  const chat = await getChat(chatId)
  if (!chat) notFound()

  return (
    <DesktopPanelProvider chatId={chatId}>
      <ResizablePanelGroup orientation="horizontal" className="h-svh overflow-hidden">
        <ResizablePanel minSize="30%" style={{ overflow: "hidden" }}>
          <div className="flex h-full min-h-0 flex-col">
            <ChatHeader title={chat.title} bot={chat.bot} />
            <Chat chatId={chatId} />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <DesktopPanel />
      </ResizablePanelGroup>
    </DesktopPanelProvider>
  )
}
