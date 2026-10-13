"use client"

import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import { isToolUIPart, type ToolUIPart, type DynamicToolUIPart, type UIMessage } from "ai"
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
import { Image } from "@/components/ai-elements/image"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import type { ViewScreenOutput } from "@/lib/computer-tools"
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

const toolTitles: Record<string, string> = {
  bash: "Run command",
  read_file: "Read file",
  write_file: "Write file",
  list_files: "List files",
  mouse_click: "Click",
  mouse_move: "Move mouse",
  mouse_scroll: "Scroll",
  keyboard_type: "Type",
  keyboard_press: "Press key",
  viewscreen: "View screen",
}

function isScreenshot(output: unknown): output is ViewScreenOutput {
  return (
    typeof output === "object" &&
    output !== null &&
    "type" in output &&
    output.type === "screenshot"
  )
}

function ToolCall({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const name =
    part.type === "dynamic-tool" ? part.toolName : part.type.slice("tool-".length)
  const title = toolTitles[name] ?? name
  const header =
    part.type === "dynamic-tool" ? (
      <ToolHeader
        title={title}
        type={part.type}
        state={part.state}
        toolName={part.toolName}
      />
    ) : (
      <ToolHeader title={title} type={part.type} state={part.state} />
    )
  const output = part.state === "output-available" ? part.output : undefined

  return (
    <Tool defaultOpen={name === "viewscreen"}>
      {header}
      <ToolContent>
        {name !== "viewscreen" && <ToolInput input={part.input} />}
        {isScreenshot(output) ? (
          <Image
            alt="Screenshot of the sandbox desktop"
            base64={output.data}
            mediaType={output.mediaType}
            uint8Array={new Uint8Array()}
          />
        ) : (
          <ToolOutput
            output={output}
            errorText={part.state === "output-error" ? part.errorText : undefined}
          />
        )}
      </ToolContent>
    </Tool>
  )
}

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
                              ) : isToolUIPart(part) ? (
                                <ToolCall key={i} part={part} />
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
