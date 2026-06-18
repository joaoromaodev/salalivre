import { notFound } from "next/navigation";
import { buscarReservaPorId } from "@/lib/reservas";
import { ReservaForm } from "@/components/reserva-form";
import { CancelarReservaButton } from "@/components/cancelar-reserva-button";
import { Separator } from "@/components/ui/separator";

interface ReservaPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservaPage({ params }: ReservaPageProps) {
  const { id } = await params;
  const reserva = await buscarReservaPorId(id);

  if (!reserva) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Editar reserva
        </h1>
        <p className="text-sm text-muted-foreground">
          Altere os dados ou cancele esta reserva da sala.
        </p>
      </div>

      <ReservaForm reservaExistente={reserva} />

      <Separator />

      <CancelarReservaButton reservaId={reserva.id} />
    </div>
  );
}
