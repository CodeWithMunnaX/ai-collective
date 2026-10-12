"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { ChatAvatar } from "@/components/chat-avatar"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function SidebarChatItem({
  id,
  title,
  avatar,
  preview,
  lastMessageAgo,
}: {
  id: string
  title: string
  avatar: string
  preview: string | null
  lastMessageAgo: string
}) {
  const { chatId } = useParams<{ chatId?: string }>()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        tooltip={title}
        isActive={chatId === id}
        className="items-center gap-3 group-data-[collapsible=icon]:p-0!"
        render={<Link href={`/chats/${id}`} />}
      >
        <ChatAvatar seed={avatar} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium">{title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {lastMessageAgo}
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {preview}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
