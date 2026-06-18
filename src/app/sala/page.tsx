import type { Metadata } from "next";
import { AgendaPublica } from "@/components/agenda-publica";

export const metadata: Metadata = {
  title: "SalaLivre — Disponibilidade da sala",
  description: "Consulte os horários livres e ocupados da sala de reunião.",
};

export default function SalaPublicaPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <header className="mb-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Disponibilidade da sala
        </h1>
        <p className="text-sm text-muted-foreground">
          Toque em um dia para ver os horários livres e ocupados.
        </p>
      </header>

      <AgendaPublica />

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        Para reservar, procure o setor responsável pela sala.
      </footer>
    </div>
  );
}
