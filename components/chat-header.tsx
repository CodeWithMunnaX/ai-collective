import { MonitorIcon } from "lucide-react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import type { ChatDetail } from "@/queries/chats"

export function ChatHeader({ title, bot }: Pick<ChatDetail, "title" | "bot">) {
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
      {/* Placeholder: intentionally does nothing yet. */}
      <Button type="button" variant="ghost" size="icon" aria-label="Desktop">
        <MonitorIcon />
      </Button>
    </header>
  )
}
