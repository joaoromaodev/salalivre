"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { OcupacaoPublica } from "@/lib/reservas";
import { calcularStatusDoDia, construirGradeDoDia } from "@/lib/grade-dia";
import {
  EXPEDIENTE_FIM_MIN,
  EXPEDIENTE_INICIO_MIN,
  horaParaMinutos,
} from "@/config/agenda";

import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

function inicioDoDiaDeHoje(): Date {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return agora;
}

function dateParaDataString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

type StatusAgora =
  | { tipo: "livre"; detalhe: string }
  | { tipo: "ocupada"; detalhe: string }
  | { tipo: "fora"; detalhe: string };

export function AgendaPublica() {
  const hoje = useMemo(inicioDoDiaDeHoje, []);

  const [agora, setAgora] = useState<Date>(() => new Date());
  const [mesAtual, setMesAtual] = useState<Date>(hoje);
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(hoje);
  const [ocupacao, setOcupacao] = useState<OcupacaoPublica[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarMes = useCallback((mes: Date) => {
    const mesParam = format(mes, "yyyy-MM");
    return fetch(`/api/publico/agenda?mes=${mesParam}`)
      .then((resposta) => resposta.json())
      .then((json) => setOcupacao(json.ocupacao ?? []));
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    carregarMes(mesAtual).finally(() => {
      if (!cancelado) setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [mesAtual, carregarMes]);

  // Mantém o "status agora" e os dados frescos numa tela parada na porta.
  useEffect(() => {
    const id = setInterval(() => {
      setAgora(new Date());
      carregarMes(mesAtual);
    }, 60_000);
    return () => clearInterval(id);
  }, [mesAtual, carregarMes]);

  const ocupacaoPorData = useMemo(() => {
    const mapa = new Map<string, OcupacaoPublica[]>();
    for (const item of ocupacao) {
      const lista = mapa.get(item.data) ?? [];
      lista.push(item);
      mapa.set(item.data, lista);
    }
    return mapa;
  }, [ocupacao]);

  const { diasLivres, diasParciais, diasCheios } = useMemo(() => {
    const livres: Date[] = [];
    const parciais: Date[] = [];
    const cheios: Date[] = [];

    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      const status = calcularStatusDoDia(
        ocupacaoPorData.get(dateParaDataString(data)) ?? []
      );
      if (status === "cheio") cheios.push(data);
      else if (status === "parcial") parciais.push(data);
      else livres.push(data);
    }

    return { diasLivres: livres, diasParciais: parciais, diasCheios: cheios };
  }, [mesAtual, ocupacaoPorData]);

  const gradeDoDia = useMemo(
    () =>
      construirGradeDoDia(
        ocupacaoPorData.get(dateParaDataString(diaSelecionado)) ?? []
      ),
    [ocupacaoPorData, diaSelecionado]
  );

  // Status da sala "agora": livre / ocupada / fora do expediente.
  const statusAgora: StatusAgora = useMemo(() => {
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const reservasHoje = (ocupacaoPorData.get(dateParaDataString(agora)) ?? [])
      .map((r) => ({
        inicio: horaParaMinutos(r.hora_inicio.slice(0, 5)),
        fim: horaParaMinutos(r.hora_fim.slice(0, 5)),
      }))
      .sort((a, b) => a.inicio - b.inicio);

    const minutosParaHora = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    const atual = reservasHoje.find(
      (r) => r.inicio <= minutosAgora && minutosAgora < r.fim
    );
    if (atual) {
      return { tipo: "ocupada", detalhe: `Ocupada até ${minutosParaHora(atual.fim)}` };
    }

    if (minutosAgora < EXPEDIENTE_INICIO_MIN || minutosAgora >= EXPEDIENTE_FIM_MIN) {
      return {
        tipo: "fora",
        detalhe: `Atendimento ${minutosParaHora(EXPEDIENTE_INICIO_MIN)}–${minutosParaHora(EXPEDIENTE_FIM_MIN)}`,
      };
    }

    const proxima = reservasHoje.find((r) => r.inicio > minutosAgora);
    return {
      tipo: "livre",
      detalhe: proxima
        ? `Livre até ${minutosParaHora(proxima.inicio)}`
        : "Livre pelo resto do expediente",
    };
  }, [agora, ocupacaoPorData]);

  const pontoStatus =
    "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full";

  const heroEstilo =
    statusAgora.tipo === "ocupada"
      ? "border-ocupado/30 bg-ocupado-surface"
      : statusAgora.tipo === "livre"
        ? "border-livre/30 bg-livre-surface"
        : "border-border bg-muted";
  const heroPonto =
    statusAgora.tipo === "ocupada"
      ? "bg-ocupado"
      : statusAgora.tipo === "livre"
        ? "bg-livre"
        : "bg-muted-foreground";
  const heroTexto =
    statusAgora.tipo === "ocupada"
      ? "text-ocupado"
      : statusAgora.tipo === "livre"
        ? "text-livre"
        : "text-foreground";
  const heroLabel =
    statusAgora.tipo === "ocupada"
      ? "Ocupada agora"
      : statusAgora.tipo === "livre"
        ? "Livre agora"
        : "Fora do expediente";

  return (
    <div className="space-y-5">
      {/* Destaque "status agora" — o que importa para quem olha na porta. */}
      {carregando ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : (
        <div
          className={`flex items-center gap-4 rounded-2xl border p-5 shadow-xs ${heroEstilo}`}
        >
          <span className="relative flex size-3.5 shrink-0">
            {statusAgora.tipo === "livre" && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-livre opacity-60" />
            )}
            <span className={`relative inline-flex size-3.5 rounded-full ${heroPonto}`} />
          </span>
          <div className="min-w-0">
            <p className={`text-lg font-semibold ${heroTexto}`}>{heroLabel}</p>
            <p className="text-sm text-muted-foreground">{statusAgora.detalhe}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-3 shadow-xs">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            month={mesAtual}
            onMonthChange={setMesAtual}
            selected={diaSelecionado}
            onSelect={(data) => data && setDiaSelecionado(data)}
            disabled={carregando}
            modifiers={{
              livre: diasLivres,
              parcial: diasParciais,
              cheio: diasCheios,
            }}
            modifiersClassNames={{
              livre: `${pontoStatus} after:bg-livre`,
              parcial: `${pontoStatus} after:bg-parcial`,
              cheio: `${pontoStatus} after:bg-ocupado`,
            }}
            locale={ptBR}
            className="[--cell-size:--spacing(10)]"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-livre" /> Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-parcial" /> Parcial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ocupado" /> Cheio
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold first-letter:uppercase">
          {format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>

        {carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <ul className="space-y-2">
            {gradeDoDia.map((item, indice) =>
              item.tipo === "livre" ? (
                <li
                  key={`livre-${indice}`}
                  className="flex items-center gap-2.5 rounded-xl border border-livre/30 bg-livre-surface px-3.5 py-3 text-sm"
                >
                  <span className="size-2 shrink-0 rounded-full bg-livre" />
                  <span className="font-medium tabular-nums">
                    {item.inicio}–{item.fim}
                  </span>
                  <span className="ml-auto font-medium text-livre">Vago</span>
                </li>
              ) : (
                <li
                  key={`ocupado-${indice}`}
                  className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-xs"
                >
                  <span className="size-2 shrink-0 rounded-full bg-ocupado" />
                  <span className="font-medium tabular-nums">
                    {item.inicio}–{item.fim}
                  </span>
                  <span className="ml-auto font-medium text-muted-foreground">
                    Ocupado
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
