"use client"

import { MonitorIcon } from "lucide-react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { useToggleDesktopPanel } from "@/components/desktop-panel"
import { Button } from "@/components/ui/button"
import type { ChatDetail } from "@/queries/chats"

export function ChatHeader({ title, bot }: Pick<ChatDetail, "title" | "bot">) {
  const toggleDesktop = useToggleDesktopPanel()

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <BotDialog
        bot={bot}
        trigger={
          <Button
            type="button"
            variant="ghost"
            className="min-w-0 justify-start gap-2 px-2"
          >
            <ChatAvatar seed={bot.avatar} className="shrink-0" />
            <span className="truncate text-sm font-medium">{title}</span>
          </Button>
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle desktop"
        onClick={toggleDesktop}
      >
        <MonitorIcon />
      </Button>
    </header>
  )
}
