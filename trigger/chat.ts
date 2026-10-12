import { openai } from "@ai-sdk/openai"
import { chat } from "@trigger.dev/sdk/ai"

// Transcript storage is the platform default: the conversation is saved per
// chatId and read back on reload or when a fresh run continues the chat.
export const aiChat = chat.agent({
  id: "ai-chat",
  // `streamText` comes from the run argument, not from "ai", so the SDK's
  // managed options apply.
  run: async ({ messages, signal, streamText }) =>
    streamText({
      model: openai("gpt-5.6"),
      instructions: "You are a helpful assistant.",
      messages,
      abortSignal: signal,
    }),
})
