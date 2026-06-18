"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CancelarReservaButtonProps {
  reservaId: string;
}

export function CancelarReservaButton({
  reservaId,
}: CancelarReservaButtonProps) {
  const router = useRouter();
  const [cancelando, setCancelando] = useState(false);

  async function handleCancelar() {
    setCancelando(true);
    try {
      const resposta = await fetch(`/api/reservas/${reservaId}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        const json = await resposta.json().catch(() => ({}));
        toast.error(json.error ?? "Não foi possível cancelar a reserva.");
        return;
      }

      toast.success("Reserva cancelada.");
      router.push("/agenda");
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" className="w-full" />}
      >
        <Trash2Icon className="size-4" />
        Cancelar reserva
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. O horário voltará a ficar
            disponível para novos agendamentos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancelando}
            onClick={handleCancelar}
          >
            {cancelando ? "Cancelando..." : "Sim, cancelar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
