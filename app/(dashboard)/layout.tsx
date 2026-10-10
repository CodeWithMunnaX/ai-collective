import { Show, SignIn } from "@clerk/nextjs"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Show when="signed-in">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </Show>
      <Show when="signed-out">
        <div className="flex min-h-svh items-center justify-center p-6">
          <SignIn />
        </div>
      </Show>
    </>
  )
}
