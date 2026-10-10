import Link from "next/link"
import { connection } from "next/server"
import { Show } from "@clerk/nextjs"
import { PlusIcon } from "lucide-react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  await connection()
  const seed = crypto.randomUUID()

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <ChatAvatar seed={seed} animated className="size-12" />
          </EmptyMedia>
          <EmptyTitle>Meet your first bot</EmptyTitle>
          <EmptyDescription>
            Every bot gets its own personality, memory, and face. Spin one up
            and start the conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Show when="signed-in">
            <BotDialog
              trigger={
                <Button variant="secondary">
                  <PlusIcon data-icon="inline-start" />
                  Create a new bot
                </Button>
              }
            />
          </Show>
          <Show when="signed-out">
            <Button
              variant="secondary"
              render={<Link href="/sign-in" />}
              nativeButton={false}
            >
              Sign in to create a bot
            </Button>
          </Show>
        </EmptyContent>
      </Empty>
    </div>
  )
}
