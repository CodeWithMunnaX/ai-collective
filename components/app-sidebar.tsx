import { UserButton } from "@clerk/nextjs"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
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
