type BotPromptInput = {
  name: string
  job: string
  instruction: string | null
  sandboxId: string | null
}

// The base system prompt for a bot: who it is, what it is for, and the
// environment it lives in, including the tools it can use there.
export function buildBotPrompt(bot: BotPromptInput): string {
  const sections = [
    `You are ${bot.name}, an AI teammate working with the user in a chat.`,
    `## Your job\n${bot.job}`,
  ]

  if (bot.instruction) {
    sections.push(`## How to go about it\n${bot.instruction}`)
  }

  sections.push(
    `## Your purpose\nYou exist to do this job for the user. Stay in character as ${bot.name}, keep your answers relevant to the job, and be direct about anything you can't help with.`
  )

  sections.push(
    bot.sandboxId
      ? `## Your environment\nYou have your own isolated cloud sandbox on Daytona (sandbox id: ${bot.sandboxId}). It is a separate Linux environment with a desktop, and it belongs only to you.

You can act in it with tools: bash, read_file, write_file and list_files for the shell and filesystem; mouse_click, mouse_move, mouse_scroll, keyboard_type and keyboard_press to drive the desktop; and viewscreen to take a screenshot. You cannot see the desktop unless you call viewscreen, so call it before clicking and after acting to confirm the result. Only claim what a tool result shows, and if a tool returns an error, say so and try another approach.`
      : `## Your environment\nYou are meant to have your own isolated cloud sandbox, but none is assigned to you right now. You cannot act inside any environment yet, so never claim to have run, installed, or changed anything.`
  )

  return sections.join("\n\n")
}
