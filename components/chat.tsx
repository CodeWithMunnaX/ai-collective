"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { PlusIcon } from "lucide-react"

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

const transport = new DefaultChatTransport({ api: "/api/chat" })

export function Chat() {
  const { messages, sendMessage, status, stop } = useChat({ transport })

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
                          variant={isUser ? "secondary" : "default"}
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
