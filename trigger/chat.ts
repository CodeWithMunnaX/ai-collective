import { openai } from "@ai-sdk/openai"
import { chat } from "@trigger.dev/sdk/ai"
import { stepCountIs } from "ai"
import { asc, eq } from "drizzle-orm"

import { buildBotPrompt } from "@/lib/bot-prompt"
import { createComputerTools } from "@/lib/computer-tools"
import { db } from "@/lib/db"
import { chatMembers } from "@/lib/db/schema"

// The bot's sandbox, set each turn so `run` can bind the tools to it.
const sandbox = chat.local<{ id: string | null }>({ id: "sandbox" })

// Transcript storage is the platform default: the conversation is saved per
// chatId and read back on reload or when a fresh run continues the chat.
export const aiChat = chat.agent({
  id: "ai-chat",
  // Runs every turn, so continuation runs get the prompt too. The bot is
  // looked up from the chatId rather than taken from client data; the start
  // action has already checked that the signed-in user owns this chat.
  onTurnStart: async ({ chatId }) => {
    const member = await db.query.chatMembers.findFirst({
      where: eq(chatMembers.chatId, chatId),
      orderBy: asc(chatMembers.joinedAt),
      with: {
        bot: {
          columns: {
            name: true,
            job: true,
            instruction: true,
            sandboxId: true,
          },
        },
      },
    })
    if (!member) throw new Error(`No bot found for chat ${chatId}.`)

    sandbox.init({ id: member.bot.sandboxId })
    chat.prompt.set(buildBotPrompt(member.bot))
  },
  // `streamText` comes from the run argument, not from "ai", so the SDK's
  // managed options apply, including the prompt set above.
  run: async ({ messages, signal, streamText }) =>
    streamText({
      model: openai("gpt-5.6"),
      messages,
      abortSignal: signal,
      // No sandbox, no tools: the prompt tells the bot it has no environment.
      tools: sandbox.id ? createComputerTools(sandbox.id) : undefined,
      stopWhen: stepCountIs(25),
    }),
})
