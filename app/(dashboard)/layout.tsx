import { Show, SignIn } from "@clerk/nextjs"
import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  // Missing cookie means first visit: default to expanded.
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <>
      <Show when="signed-in">
        <SidebarProvider defaultOpen={defaultOpen}>
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
