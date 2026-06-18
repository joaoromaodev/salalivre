import { NextResponse } from "next/server";
import { z } from "zod";
import { isExclusionViolation } from "@/lib/db-erros";
import { atualizarReserva, buscarReservaPorId, cancelarReserva } from "@/lib/reservas";
import { reservaUpdateSchema } from "@/lib/validacao";

const MENSAGEM_CONFLITO =
  "Esse horário conflita com outra reserva já existente (considerando os 10 minutos de tolerância entre reservas).";

interface RotaParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RotaParams) {
  const { id } = await params;
  const reserva = await buscarReservaPorId(id);
  if (!reserva) {
    return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ reserva });
}

export async function PATCH(request: Request, { params }: RotaParams) {
  const { id } = await params;

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const resultado = reservaUpdateSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: z.treeifyError(resultado.error) },
      { status: 400 }
    );
  }

  try {
    const reserva = await atualizarReserva(id, resultado.data);
    if (!reserva) {
      return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ reserva });
  } catch (erro) {
    if (isExclusionViolation(erro)) {
      return NextResponse.json({ error: MENSAGEM_CONFLITO }, { status: 409 });
    }
    console.error("Erro ao atualizar reserva:", erro);
    return NextResponse.json({ error: "Erro ao atualizar reserva." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RotaParams) {
  const { id } = await params;
  const cancelada = await cancelarReserva(id);
  if (!cancelada) {
    return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
