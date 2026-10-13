"use client"

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { MonitorIcon } from "lucide-react"
import { usePanelRef, type PanelImperativeHandle } from "react-resizable-panels"

import { getChatDesktopUrl } from "@/actions/chat"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ResizablePanel } from "@/components/ui/resizable"

type DesktopState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; error: string }

const DesktopPanelContext = createContext<{
  panelRef: RefObject<PanelImperativeHandle | null>
  ensureLoaded: () => void
  setPanelSlot: (el: HTMLElement | null) => void
  setDialogSlot: (el: HTMLElement | null) => void
  openDialog: () => void
  state: DesktopState
} | null>(null)

function useDesktopPanel() {
  const ctx = use(DesktopPanelContext)
  if (!ctx) throw new Error("Must be used within DesktopPanelProvider")
  return ctx
}

/**
 * Owns the single VNC iframe. The iframe is never re-parented (that would
 * reload it): it floats above the page and is sized to whichever slot is
 * active, the dialog's when open, otherwise the panel's.
 */
export function DesktopPanelProvider({
  chatId,
  children,
}: {
  chatId: string
  children: ReactNode
}) {
  const panelRef = usePanelRef()
  const [state, setState] = useState<DesktopState>({ status: "idle" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [panelSlot, setPanelSlot] = useState<HTMLElement | null>(null)
  const [dialogSlot, setDialogSlot] = useState<HTMLElement | null>(null)
  const startedRef = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const ensureLoaded = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setState({ status: "loading" })
    getChatDesktopUrl(chatId).then(
      (res) =>
        setState(
          res.ok
            ? { status: "ready", url: res.url }
            : { status: "error", error: res.error }
        ),
      () => setState({ status: "error", error: "Couldn't start the desktop." })
    )
  }, [chatId])

  const openDialog = useCallback(() => {
    ensureLoaded()
    setDialogOpen(true)
  }, [ensureLoaded])

  const target = dialogOpen ? dialogSlot : panelSlot

  // Keep the floating iframe glued to the active slot.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    let raf = 0
    let last = ""
    const sync = () => {
      const rect = target?.getBoundingClientRect()
      const key = rect
        ? `${rect.left}|${rect.top}|${rect.width}|${rect.height}`
        : ""
      if (key !== last) {
        last = key
        if (rect && rect.width > 0 && rect.height > 0) {
          frame.style.cssText = `visibility:visible;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`
        } else {
          frame.style.visibility = "hidden"
        }
      }
      raf = requestAnimationFrame(sync)
    }
    sync()
    return () => cancelAnimationFrame(raf)
  }, [target])

  // Hand keyboard focus to the desktop once the dialog is up.
  useEffect(() => {
    if (!dialogOpen) return
    const id = setTimeout(() => iframeRef.current?.focus(), 150)
    return () => clearTimeout(id)
  }, [dialogOpen])

  return (
    <DesktopPanelContext
      value={{
        panelRef,
        ensureLoaded,
        setPanelSlot,
        setDialogSlot,
        openDialog,
        state,
      }}
    >
      {children}

      {/* Only the dialog's close button may close it: no Escape, no outside
          click, no focus loss. Non-modal so the floating iframe, which lives
          outside the popup, stays interactive instead of being made inert. */}
      <Dialog
        open={dialogOpen}
        modal={false}
        disablePointerDismissal
        onOpenChange={(open, details) => {
          if (open || details.reason === "close-press") setDialogOpen(open)
        }}
      >
        <DialogContent
          showCloseButton
          className="top-0 left-0 flex h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-2 rounded-none p-2 sm:max-w-none"
        >
          <div className="flex h-8 shrink-0 items-center pl-1">
            <DialogTitle>Desktop</DialogTitle>
            <DialogDescription className="sr-only">
              Live desktop of the bot&apos;s sandbox. Keyboard and mouse input
              go to the desktop.
            </DialogDescription>
          </div>
          <div ref={setDialogSlot} className="min-h-0 flex-1" />
        </DialogContent>
      </Dialog>

      <div
        ref={frameRef}
        className="fixed z-[60] overflow-hidden bg-muted"
        style={{
          visibility: "hidden",
          // In the panel the preview is a click target, in the dialog it is live.
          pointerEvents: dialogOpen ? "auto" : "none",
        }}
      >
        {state.status === "ready" ? (
          <iframe
            ref={iframeRef}
            src={state.url}
            title="Sandbox desktop"
            allow="clipboard-read; clipboard-write; fullscreen"
            className="size-full border-0"
          />
        ) : (
          <div className="flex size-full items-center justify-center gap-2 text-sm text-muted-foreground">
            {state.status === "error" ? (
              state.error
            ) : (
              <>
                <Spinner />
                Starting desktop…
              </>
            )}
          </div>
        )}
      </div>
    </DesktopPanelContext>
  )
}

export function useToggleDesktopPanel() {
  const { panelRef } = useDesktopPanel()
  return () => {
    const panel = panelRef.current
    if (!panel) return
    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }
}

export function DesktopPanel() {
  const { panelRef, ensureLoaded, setPanelSlot, openDialog } = useDesktopPanel()
  return (
    <ResizablePanel
      panelRef={panelRef}
      collapsible
      collapsedSize="0%"
      defaultSize="0%"
      minSize="25%"
      maxSize="70%"
      style={{ overflow: "hidden" }}
      onResize={(size) => {
        if (size.asPercentage > 0) ensureLoaded()
      }}
    >
      <button
        type="button"
        ref={setPanelSlot}
        onClick={openDialog}
        aria-label="Open desktop fullscreen"
        className="group relative block aspect-video w-full cursor-pointer"
      >
        <span className="absolute top-2 right-2 z-[70] rounded-md bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <MonitorIcon className="size-4" />
        </span>
      </button>
    </ResizablePanel>
  )
}
