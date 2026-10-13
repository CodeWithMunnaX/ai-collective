import "server-only"

import { Daytona, DaytonaNotFoundError } from "@daytona/sdk"

// Reads DAYTONA_API_KEY and DAYTONA_API_URL from the environment.
const daytona = new Daytona()

/** Creates a sandbox for a bot and returns its id. Nothing is run in it. */
export async function createSandbox(): Promise<string> {
  const sandbox = await daytona.create()
  return sandbox.id
}

/** Deletes a sandbox. A sandbox that no longer exists counts as deleted. */
export async function deleteSandbox(sandboxId: string): Promise<void> {
  try {
    const sandbox = await daytona.get(sandboxId)
    await daytona.delete(sandbox)
  } catch (error) {
    if (error instanceof DaytonaNotFoundError) return
    throw error
  }
}

const NOVNC_PORT = 6080

/**
 * Starts the sandbox's desktop (Xvfb, xfce4, x11vnc, noVNC) and returns a
 * signed noVNC URL that can be embedded in an iframe without extra headers.
 */
export async function getDesktopUrl(sandboxId: string): Promise<string> {
  const sandbox = await daytona.get(sandboxId)
  if (sandbox.state !== "started") await sandbox.start()
  await sandbox.computerUse.start()
  const { url } = await sandbox.getSignedPreviewUrl(NOVNC_PORT, 3600)
  const viewer = new URL(url)
  viewer.pathname = "/vnc.html"
  viewer.searchParams.set("autoconnect", "true")
  viewer.searchParams.set("resize", "scale")
  return viewer.toString()
}
