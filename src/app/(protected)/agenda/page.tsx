import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";

import { AgendaView } from "@/components/agenda-view";
import { Button } from "@/components/ui/button";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Disponibilidade da sala e próximas reservas.
          </p>
        </div>
        <Button render={<Link href="/novo" />} className="h-9 shrink-0">
          <CalendarPlusIcon className="size-4" />
          Novo
        </Button>
      </div>
      <AgendaView />
    </div>
  );
}
