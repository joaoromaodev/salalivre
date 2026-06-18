import { ReservaForm } from "@/components/reserva-form";

export default function NovoAgendamentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Novo agendamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre a reserva da sala em nome de quem vai usá-la.
        </p>
      </div>
      <ReservaForm />
    </div>
  );
}
