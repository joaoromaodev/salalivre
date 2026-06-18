import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link href="/agenda" className="font-semibold tracking-tight">
            SalaLivre
          </Link>
          <nav className="flex items-center gap-1">
            <Button render={<Link href="/agenda" />} variant="ghost" size="sm">
              Agenda
            </Button>
            <Button render={<Link href="/novo" />} variant="ghost" size="sm">
              Novo
            </Button>
            <Button render={<Link href="/qrcode" />} variant="ghost" size="sm">
              QR
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
