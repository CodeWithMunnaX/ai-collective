import { UserButton } from "@clerk/nextjs"
import { formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"

import { ChatAvatar } from "@/components/chat-avatar"
import { SidebarCreateMenu } from "@/components/sidebar-create-menu"
import { SidebarSearch } from "@/components/sidebar-search"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getUserChats } from "@/queries/bots"

export async function AppSidebar() {
  const chats = await getUserChats()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex justify-end group-data-[collapsible=icon]:justify-center">
          <SidebarCreateMenu />
        </div>
        <SidebarSearch chats={chats} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={chat.title}
                    className="items-center gap-3 group-data-[collapsible=icon]:p-0!"
                    render={<Link href={`/chats/${chat.id}`} />}
                  >
                    <ChatAvatar seed={chat.avatar} className="shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">
                          {chat.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(chat.lastMessageAt)}
                        </span>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {chat.preview}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* UserButton owns its own <button> trigger, so the menu button renders as a div and the trigger fills it. */}
            <SidebarMenuButton render={<div />} className="p-0!">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: "size-full!",
                    userButtonBox:
                      "w-full! flex-row-reverse! justify-end! gap-2!",
                    userButtonOuterIdentifier:
                      "m-0! text-sm! text-sidebar-foreground! group-data-[collapsible=icon]:hidden!",
                    userButtonTrigger:
                      "size-full! justify-start! rounded-md! flex! p-2! bg-transparent! hover:bg-transparent! active:bg-transparent! shadow-none! focus-visible:ring-sidebar-ring! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-1!",
                    userButtonAvatarBox: "size-6!",
                    userButtonAvatarImage: "size-6!",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
