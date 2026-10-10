import Link from "next/link"
import { Show, UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <Link href="/" className="font-medium">
        AI Teamates
      </Link>
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <Button variant="ghost" render={<Link href="/sign-in" />} nativeButton={false}>
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />} nativeButton={false}>
            Sign up
          </Button>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  )
}
