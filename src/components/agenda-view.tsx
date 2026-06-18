"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SearchIcon } from "lucide-react";

import type { Reserva } from "@/lib/reservas";
import { calcularStatusDoDia, construirGradeDoDia } from "@/lib/grade-dia";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

function inicioDoDiaDeHoje(): Date {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return agora;
}

function dateParaDataString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function AgendaView() {
  const hoje = useMemo(inicioDoDiaDeHoje, []);

  const [mesAtual, setMesAtual] = useState<Date>(hoje);
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(hoje);
  const [reservasDoMes, setReservasDoMes] = useState<Reserva[]>([]);
  const [carregandoMes, setCarregandoMes] = useState(true);

  const [busca, setBusca] = useState("");
  const [reservasProximas, setReservasProximas] = useState<Reserva[]>([]);
  const [carregandoProximas, setCarregandoProximas] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregandoMes(true);
    const mesParam = format(mesAtual, "yyyy-MM");

    fetch(`/api/reservas?mes=${mesParam}`)
      .then((resposta) => resposta.json())
      .then((json) => {
        if (!cancelado) setReservasDoMes(json.reservas ?? []);
      })
      .finally(() => {
        if (!cancelado) setCarregandoMes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [mesAtual]);

  useEffect(() => {
    let cancelado = false;
    setCarregandoProximas(true);

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (busca.trim()) params.set("busca", busca.trim());

      fetch(`/api/reservas?${params.toString()}`)
        .then((resposta) => resposta.json())
        .then((json) => {
          if (!cancelado) setReservasProximas(json.reservas ?? []);
        })
        .finally(() => {
          if (!cancelado) setCarregandoProximas(false);
        });
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca]);

  const reservasPorData = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    for (const reserva of reservasDoMes) {
      const lista = mapa.get(reserva.data) ?? [];
      lista.push(reserva);
      mapa.set(reserva.data, lista);
    }
    return mapa;
  }, [reservasDoMes]);

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
        reservasPorData.get(dateParaDataString(data)) ?? []
      );
      if (status === "cheio") cheios.push(data);
      else if (status === "parcial") parciais.push(data);
      else livres.push(data);
    }

    return { diasLivres: livres, diasParciais: parciais, diasCheios: cheios };
  }, [mesAtual, reservasPorData]);

  const gradeDoDia = useMemo(
    () =>
      construirGradeDoDia(
        reservasPorData.get(dateParaDataString(diaSelecionado)) ?? []
      ),
    [reservasPorData, diaSelecionado]
  );

  const pontoStatus =
    "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full";

  return (
    <Tabs defaultValue="calendario" className="gap-4">
      <TabsList className="w-full">
        <TabsTrigger value="calendario" className="flex-1">
          Calendário
        </TabsTrigger>
        <TabsTrigger value="proximas" className="flex-1">
          Próximas reservas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendario" className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Calendar
            mode="single"
            month={mesAtual}
            onMonthChange={setMesAtual}
            selected={diaSelecionado}
            onSelect={(data) => data && setDiaSelecionado(data)}
            disabled={carregandoMes}
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

          {carregandoMes ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : gradeDoDia.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum horário no expediente.
            </p>
          ) : (
            <ul className="space-y-2">
              {gradeDoDia.map((item, indice) =>
                item.tipo === "livre" ? (
                  <li
                    key={`livre-${indice}`}
                    className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground"
                  >
                    Vago — {item.inicio}–{item.fim}
                  </li>
                ) : (
                  <li key={item.reserva.id}>
                    <Link
                      href={`/reservas/${item.reserva.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.reserva.nome_responsavel}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            — {item.reserva.setor}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {item.inicio}–{item.fim}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        Ocupado
                      </Badge>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </TabsContent>

      <TabsContent value="proximas" className="space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou setor"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>

        {carregandoProximas ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : reservasProximas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma reserva encontrada.
          </p>
        ) : (
          <ul className="space-y-2">
            {reservasProximas.map((reserva) => (
              <li key={reserva.id}>
                <Link
                  href={`/reservas/${reserva.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {reserva.nome_responsavel}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        — {reserva.setor}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {format(
                        new Date(`${reserva.data}T00:00:00`),
                        "dd/MM (EEE)",
                        { locale: ptBR }
                      )}{" "}
                      · {reserva.hora_inicio.slice(0, 5)}–
                      {reserva.hora_fim.slice(0, 5)}
                    </p>
                  </div>
                  {reserva.dia_inteiro && (
                    <Badge variant="secondary" className="shrink-0">
                      Dia inteiro
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}
