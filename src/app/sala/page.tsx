import type { Metadata } from "next";
import { CalendarCheckIcon } from "lucide-react";

import { AgendaPublica } from "@/components/agenda-publica";

export const metadata: Metadata = {
  title: "SalaLivre — Disponibilidade da sala",
  description: "Consulte os horários livres e ocupados da sala de reunião.",
};

export default function SalaPublicaPage() {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(70%_100%_at_50%_0%,var(--accent),transparent_75%)]"
      />
      <header className="mb-5 flex flex-col items-center text-center">
        <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <CalendarCheckIcon className="size-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Sala de reunião
        </h1>
        <p className="text-sm text-muted-foreground">
          Toque em um dia para ver os horários livres e ocupados.
        </p>
      </header>

      <AgendaPublica />

      <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
        Para reservar, procure o setor responsável pela sala.
      </footer>
    </div>
  );
}
