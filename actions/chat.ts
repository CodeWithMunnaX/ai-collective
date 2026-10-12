"use server"

import { auth } from "@trigger.dev/sdk"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"

import { getChat } from "@/queries/chats"

const start = chat.createStartSessionAction("ai-chat")
const load = chat.createLoadTranscriptAction(defaultStorage, { limit: 50 })

// The chatId comes from the browser, so every action checks that the
// signed-in user owns the chat before touching its session or transcript.
async function assertOwnsChat(chatId: string) {
  if (!(await getChat(chatId))) throw new Error("Chat not found.")
}

export async function startChatSession(params: { chatId: string }) {
  await assertOwnsChat(params.chatId)
  return start({ chatId: params.chatId })
}

export async function mintChatAccessToken(chatId: string) {
  await assertOwnsChat(chatId)
  return auth.createPublicToken({
    scopes: { read: { sessions: chatId }, write: { sessions: chatId } },
    expirationTime: "1h",
  })
}

export async function loadTranscript(params: {
  chatId: string
  limit?: number
}) {
  await assertOwnsChat(params.chatId)
  return load({ chatId: params.chatId, limit: params.limit })
}
