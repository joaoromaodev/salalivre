import { NextResponse } from "next/server";
import { z } from "zod";
import { isExclusionViolation } from "@/lib/db-erros";
import {
  criarReserva,
  listarProximasReservas,
  listarReservasDoMes,
  listarReservasPorData,
} from "@/lib/reservas";
import { reservaInputSchema } from "@/lib/validacao";

const MENSAGEM_CONFLITO =
  "Esse horário conflita com outra reserva já existente (considerando os 10 minutos de tolerância entre reservas).";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const mes = searchParams.get("mes"); // "YYYY-MM"
  const busca = searchParams.get("busca") ?? undefined;
  const limiteParam = searchParams.get("limite");

  if (data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json({ error: "Parâmetro 'data' inválido." }, { status: 400 });
    }
    const reservas = await listarReservasPorData(data);
    return NextResponse.json({ reservas });
  }

  if (mes) {
    const match = /^(\d{4})-(\d{2})$/.exec(mes);
    if (!match) {
      return NextResponse.json({ error: "Parâmetro 'mes' inválido (use YYYY-MM)." }, { status: 400 });
    }
    const reservas = await listarReservasDoMes(Number(match[1]), Number(match[2]));
    return NextResponse.json({ reservas });
  }

  const limite = limiteParam ? Number(limiteParam) : undefined;
  const reservas = await listarProximasReservas({
    busca,
    limite: Number.isFinite(limite) && limite ? limite : undefined,
  });
  return NextResponse.json({ reservas });
}

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const resultado = reservaInputSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: z.treeifyError(resultado.error) },
      { status: 400 }
    );
  }

  try {
    const reserva = await criarReserva(resultado.data);
    return NextResponse.json({ reserva }, { status: 201 });
  } catch (erro) {
    if (isExclusionViolation(erro)) {
      return NextResponse.json({ error: MENSAGEM_CONFLITO }, { status: 409 });
    }
    console.error("Erro ao criar reserva:", erro);
    return NextResponse.json({ error: "Erro ao criar reserva." }, { status: 500 });
  }
}
