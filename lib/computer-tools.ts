import { Daytona, type Sandbox } from "@daytona/sdk"
import { tool } from "ai"
import { z } from "zod"

// No "server-only" here: this runs in the Trigger.dev worker, not in Next.js.
let client: Daytona | undefined

// Created on first use so a config problem can't break importing the task.
// The endpoint is passed explicitly: the SDK refuses to guess when
// DAYTONA_API_URL is set in both .env.local and the process environment.
function getDaytona(): Daytona {
  client ??= new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
    ...(process.env.DAYTONA_API_URL && { apiUrl: process.env.DAYTONA_API_URL }),
  })
  return client
}

// Sandboxes whose desktop this worker has already started.
const desktopReady = new Set<string>()

async function getSandbox(sandboxId: string): Promise<Sandbox> {
  const sandbox = await getDaytona().get(sandboxId)
  if (sandbox.state !== "started") await sandbox.start()
  return sandbox
}

// Mouse, keyboard and screenshot tools need the desktop processes running.
async function getDesktop(sandboxId: string): Promise<Sandbox> {
  const sandbox = await getSandbox(sandboxId)
  if (!desktopReady.has(sandboxId)) {
    await sandbox.computerUse.start()
    desktopReady.add(sandboxId)
  }
  return sandbox
}

export type ViewScreenOutput = {
  type: "screenshot"
  mediaType: "image/jpeg"
  data: string
}

const point = {
  x: z.number().int().describe("Horizontal pixel position, from the left."),
  y: z.number().int().describe("Vertical pixel position, from the top."),
}

/**
 * Computer-use tools bound to one bot's sandbox. Failures come back as
 * `{ error }` results so the model can read them and recover.
 */
export function createComputerTools(sandboxId: string) {
  // Wraps an action so a Daytona failure becomes a result, not a thrown error.
  async function attempt<T>(run: () => Promise<T>) {
    try {
      return await run()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error.",
      }
    }
  }

  return {
    bash: tool({
      description:
        "Run a shell command in your sandbox and get its output and exit code. Each call starts a fresh shell, so use `cd dir && cmd` or the cwd option.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to run."),
        cwd: z
          .string()
          .optional()
          .describe("Working directory. Defaults to the sandbox home."),
        timeoutSeconds: z
          .number()
          .int()
          .positive()
          .max(300)
          .optional()
          .describe("Give up after this many seconds. Defaults to 60."),
      }),
      execute: ({ command, cwd, timeoutSeconds }) =>
        attempt(async () => {
          const sandbox = await getSandbox(sandboxId)
          const res = await sandbox.process.executeCommand(
            command,
            cwd,
            undefined,
            timeoutSeconds ?? 60
          )
          return { exitCode: res.exitCode, output: res.result }
        }),
    }),

    read_file: tool({
      description: "Read a text file from your sandbox.",
      inputSchema: z.object({
        path: z.string().describe("Path of the file to read."),
      }),
      execute: ({ path }) =>
        attempt(async () => {
          const sandbox = await getSandbox(sandboxId)
          const buffer = await sandbox.fs.downloadFile(path)
          return { path, content: buffer.toString("utf-8") }
        }),
    }),

    write_file: tool({
      description:
        "Write a text file in your sandbox, replacing it if it exists. Missing parent directories are not created; use bash `mkdir -p` first.",
      inputSchema: z.object({
        path: z.string().describe("Path of the file to write."),
        content: z.string().describe("The full file contents."),
      }),
      execute: ({ path, content }) =>
        attempt(async () => {
          const sandbox = await getSandbox(sandboxId)
          await sandbox.fs.uploadFile(Buffer.from(content, "utf-8"), path)
          return { path, bytesWritten: Buffer.byteLength(content) }
        }),
    }),

    list_files: tool({
      description: "List the files and folders in a directory of your sandbox.",
      inputSchema: z.object({
        path: z.string().describe("Directory to list."),
      }),
      execute: ({ path }) =>
        attempt(async () => {
          const sandbox = await getSandbox(sandboxId)
          const entries = await sandbox.fs.listFiles(path)
          return {
            path,
            entries: entries.map((e) => ({
              name: e.name,
              type: e.isDir ? "directory" : "file",
              size: e.size,
            })),
          }
        }),
    }),

    mouse_click: tool({
      description:
        "Click at a screen position on your desktop. Look at the screen first to find coordinates.",
      inputSchema: z.object({
        ...point,
        button: z
          .enum(["left", "right", "middle"])
          .optional()
          .describe("Mouse button. Defaults to left."),
        double: z.boolean().optional().describe("Double-click instead."),
      }),
      execute: ({ x, y, button, double }) =>
        attempt(async () => {
          const sandbox = await getDesktop(sandboxId)
          await sandbox.computerUse.mouse.click(x, y, button, double)
          return { ok: true, clicked: { x, y } }
        }),
    }),

    mouse_move: tool({
      description: "Move the mouse pointer to a screen position.",
      inputSchema: z.object(point),
      execute: ({ x, y }) =>
        attempt(async () => {
          const sandbox = await getDesktop(sandboxId)
          await sandbox.computerUse.mouse.move(x, y)
          return { ok: true, movedTo: { x, y } }
        }),
    }),

    mouse_scroll: tool({
      description: "Scroll the mouse wheel at a screen position.",
      inputSchema: z.object({
        ...point,
        direction: z.enum(["up", "down"]),
        amount: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of wheel clicks. Defaults to 3."),
      }),
      execute: ({ x, y, direction, amount }) =>
        attempt(async () => {
          const sandbox = await getDesktop(sandboxId)
          await sandbox.computerUse.mouse.scroll(x, y, direction, amount ?? 3)
          return { ok: true, scrolled: { direction, amount: amount ?? 3 } }
        }),
    }),

    keyboard_type: tool({
      description:
        "Type text into whatever has focus on your desktop. Click the target first.",
      inputSchema: z.object({
        text: z.string().describe("The text to type."),
      }),
      execute: ({ text }) =>
        attempt(async () => {
          const sandbox = await getDesktop(sandboxId)
          await sandbox.computerUse.keyboard.type(text)
          return { ok: true, typed: text.length }
        }),
    }),

    keyboard_press: tool({
      description:
        "Press a key or chord on your desktop, e.g. `enter`, `escape`, `tab`, `ctrl+c`, `alt+tab`.",
      inputSchema: z.object({
        keys: z
          .string()
          .describe("A single key or a chord joined with +, e.g. ctrl+shift+t."),
      }),
      execute: ({ keys }) =>
        attempt(async () => {
          const sandbox = await getDesktop(sandboxId)
          await sandbox.computerUse.keyboard.hotkey(keys)
          return { ok: true, pressed: keys }
        }),
    }),

    viewscreen: tool({
      description:
        "Take a screenshot of your desktop and look at it. Use it before clicking and after acting to check what happened.",
      inputSchema: z.object({}),
      execute: () =>
        attempt(async (): Promise<ViewScreenOutput> => {
          const sandbox = await getDesktop(sandboxId)
          const shot = await sandbox.computerUse.screenshot.takeCompressed({
            format: "jpeg",
            quality: 70,
          })
          if (!shot.screenshot) throw new Error("The screenshot was empty.")
          return {
            type: "screenshot",
            mediaType: "image/jpeg",
            data: shot.screenshot,
          }
        }),
      // The chat shows the full result; the model gets the image itself
      // rather than a wall of base64 text.
      toModelOutput: ({ output }) =>
        "error" in output
          ? { type: "text", value: `Screenshot failed: ${output.error}` }
          : {
              type: "content",
              value: [
                {
                  type: "file",
                  mediaType: output.mediaType,
                  data: { type: "data", data: output.data },
                },
              ],
            },
    }),
  }
}
