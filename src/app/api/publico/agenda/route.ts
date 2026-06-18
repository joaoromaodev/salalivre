import { NextResponse } from "next/server";
import { listarOcupacaoDoMes } from "@/lib/reservas";

/**
 * Endpoint PÚBLICO (liberado no middleware) que alimenta a tela da
 * porta. Retorna apenas a ocupação do mês — horários ocupados, sem
 * nome/setor/matrícula de quem reservou. Nunca exponha dados pessoais
 * aqui: a query (listarOcupacaoDoMes) já seleciona só os campos de
 * horário.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes"); // "YYYY-MM"

  const match = mes ? /^(\d{4})-(\d{2})$/.exec(mes) : null;
  if (!match) {
    return NextResponse.json(
      { error: "Parâmetro 'mes' inválido (use YYYY-MM)." },
      { status: 400 }
    );
  }

  const ocupacao = await listarOcupacaoDoMes(Number(match[1]), Number(match[2]));
  return NextResponse.json({ ocupacao });
}
