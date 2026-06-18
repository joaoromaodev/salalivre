import { AgendaView } from "@/components/agenda-view";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Consulte a disponibilidade da sala e as próximas reservas.
        </p>
      </div>
      <AgendaView />
    </div>
  );
}
