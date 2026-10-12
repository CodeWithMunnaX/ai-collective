"use client"

import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import type { UIMessage } from "ai"
import { PlusIcon } from "lucide-react"

import {
  loadTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat"
import type { aiChat } from "@/trigger/chat"

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { MessageResponse } from "@/components/ai-elements/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

export function Chat({ chatId }: { chatId: string }) {
  const transport = useTriggerChatTransport<typeof aiChat>({
    task: "ai-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId }) => startChatSession({ chatId }),
  })
  const { messages, isLoading } = useLoadTranscript(chatId, loadTranscript, {
    transport,
  })

  // useChat reads its initial messages once, so mount it after loading.
  if (isLoading) return <div className="min-h-0 flex-1" />

  return (
    <ChatView
      chatId={chatId}
      initialMessages={messages}
      transport={transport}
    />
  )
}

function ChatView({
  chatId,
  initialMessages,
  transport,
}: {
  chatId: string
  initialMessages: UIMessage[]
  transport: ReturnType<typeof useTriggerChatTransport<typeof aiChat>>
}) {
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScrollerProvider autoScroll>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {messages.map((message) => {
                const isUser = message.role === "user"
                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={isUser}
                  >
                    <Message align={isUser ? "end" : "start"}>
                      <MessageContent>
                        <Bubble
                          align={isUser ? "end" : "start"}
                          variant={isUser ? "secondary" : "ghost"}
                        >
                          <BubbleContent className="rounded-3xl px-4">
                            {message.parts.map((part, i) =>
                              part.type === "text" ? (
                                <MessageResponse key={i}>
                                  {part.text}
                                </MessageResponse>
                              ) : null
                            )}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="p-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (text) sendMessage({ text })
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="What would you like to know?" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              {/* Placeholder: intentionally does nothing yet. */}
              <PromptInputButton aria-label="Add">
                <PlusIcon />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
