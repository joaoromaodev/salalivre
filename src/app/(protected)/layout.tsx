import Link from "next/link";
import { CalendarCheckIcon, LogOutIcon } from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { DesktopNav, BottomNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link
            href="/agenda"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarCheckIcon className="size-4" />
            </span>
            SalaLivre
          </Link>

          <div className="flex items-center gap-1">
            <DesktopNav />
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <ThemeToggle />
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <LogOutIcon className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 sm:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
