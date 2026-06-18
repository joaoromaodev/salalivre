"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, CalendarPlusIcon, QrCodeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/agenda", label: "Agenda", icon: CalendarDaysIcon },
  { href: "/novo", label: "Novo", icon: CalendarPlusIcon },
  { href: "/qrcode", label: "QR", icon: QrCodeIcon },
] as const;

function estaAtivo(pathname: string, href: string): boolean {
  if (href === "/agenda") {
    return pathname === "/agenda" || pathname.startsWith("/reservas");
  }
  return pathname === href;
}

/** Navegação inline para o cabeçalho (desktop / telas largas). */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {ITENS.map(({ href, label, icon: Icon }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Barra de navegação fixa no rodapé, só no mobile. Pensada para uso com
 * o polegar no balcão; respeita a safe-area inferior (notch/iPhone).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur sm:hidden">
      <div
        className="mx-auto grid max-w-3xl grid-cols-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITENS.map(({ href, label, icon: Icon }) => {
          const ativo = estaAtivo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                ativo
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", ativo && "fill-primary/10")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
