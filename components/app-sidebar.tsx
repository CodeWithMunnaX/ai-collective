import { UserButton } from "@clerk/nextjs"
import { formatDistanceToNowStrict } from "date-fns"

import { ChatAvatar } from "@/components/chat-avatar"
import { SidebarCreateMenu } from "@/components/sidebar-create-menu"
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
} from "@/components/ui/sidebar"
import { getUserChats } from "@/queries/bots"

export async function AppSidebar() {
  const chats = await getUserChats()

  return (
    <Sidebar>
      <SidebarHeader className="flex-row justify-end">
        <SidebarCreateMenu />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton size="lg" className="items-center gap-3">
                    <ChatAvatar seed={chat.avatar} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
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
                      "m-0! text-sm! text-sidebar-foreground!",
                    userButtonTrigger:
                      "size-full! justify-start! rounded-md! flex! p-2! bg-transparent! hover:bg-transparent! active:bg-transparent! shadow-none! focus-visible:ring-sidebar-ring!",
                    userButtonAvatarBox: "size-6!",
                    userButtonAvatarImage: "size-6!",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
