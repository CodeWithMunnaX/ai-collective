"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import type { ChatWithBot } from "@/queries/bots"

const subscribe = () => () => {}
const getIsMac = () => /mac|iphone|ipad/i.test(navigator.userAgent)

export function SidebarSearch({ chats }: { chats: ChatWithBot[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isMac = useSyncExternalStore(subscribe, getIsMac, () => true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="h-8 w-full min-w-0 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent! group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:text-foreground group-data-[collapsible=icon]:hover:bg-muted! dark:group-data-[collapsible=icon]:hover:bg-muted/50! group-data-[collapsible=icon]:p-0! rounded-lg border-input bg-transparent px-2.5 py-1 text-base font-normal text-muted-foreground md:text-sm dark:bg-input/30"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="group-data-[collapsible=icon]:hidden">Search</span>
        <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Search your chats by bot name or message."
      >
        <Command>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={`${chat.title} ${chat.preview ?? ""} ${chat.id}`}
                  onSelect={() => {
                    setOpen(false)
                    router.push(`/chats/${chat.id}`)
                  }}
                >
                  <ChatAvatar seed={chat.avatar} className="size-6" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{chat.title}</span>
                    {chat.preview ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {chat.preview}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
