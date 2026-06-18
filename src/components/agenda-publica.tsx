"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { OcupacaoPublica } from "@/lib/reservas";
import { calcularStatusDoDia, construirGradeDoDia } from "@/lib/grade-dia";

import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function inicioDoDiaDeHoje(): Date {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return agora;
}

function dateParaDataString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function AgendaPublica() {
  const hoje = useMemo(inicioDoDiaDeHoje, []);

  const [mesAtual, setMesAtual] = useState<Date>(hoje);
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(hoje);
  const [ocupacao, setOcupacao] = useState<OcupacaoPublica[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    const mesParam = format(mesAtual, "yyyy-MM");

    fetch(`/api/publico/agenda?mes=${mesParam}`)
      .then((resposta) => resposta.json())
      .then((json) => {
        if (!cancelado) setOcupacao(json.ocupacao ?? []);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [mesAtual]);

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

  const pontoStatus =
    "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full";

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
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
            livre: `${pontoStatus} after:bg-emerald-500`,
            parcial: `${pontoStatus} after:bg-amber-500`,
            cheio: `${pontoStatus} after:bg-destructive`,
          }}
          locale={ptBR}
          className="rounded-lg border"
        />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" /> Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> Parcial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" /> Cheio
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">
          {format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>

        {carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ul className="space-y-2">
            {gradeDoDia.map((item, indice) =>
              item.tipo === "livre" ? (
                <li
                  key={`livre-${indice}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">
                    {item.inicio}–{item.fim}
                  </span>
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                  >
                    Vago
                  </Badge>
                </li>
              ) : (
                <li
                  key={`ocupado-${indice}`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">
                    {item.inicio}–{item.fim}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    Ocupado
                  </Badge>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
