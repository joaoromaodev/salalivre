"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRightIcon, SearchIcon } from "lucide-react";

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

  const reservasDoDia = gradeDoDia.filter((item) => item.tipo === "ocupado");

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

      <TabsContent value="calendario" className="space-y-5">
        <div className="rounded-2xl border bg-card p-3 shadow-xs">
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
              livre: "",
              parcial: `${pontoStatus} after:bg-parcial`,
              cheio: `${pontoStatus} after:bg-ocupado`,
            }}
            locale={ptBR}
            className="w-full p-0"
            classNames={{ root: "w-full" }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full ring-1 ring-inset ring-muted-foreground/40" />{" "}
              Livre
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
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold first-letter:uppercase">
              {format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            {!carregandoMes && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {reservasDoDia.length === 0
                  ? "Sala livre"
                  : `${reservasDoDia.length} ${
                      reservasDoDia.length === 1 ? "reserva" : "reservas"
                    }`}
              </span>
            )}
          </div>

          {carregandoMes ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
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
                    className="flex items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-3 text-sm text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-livre/70" />
                    <span className="font-medium tabular-nums text-foreground/70">
                      {item.inicio}–{item.fim}
                    </span>
                    <span>livre</span>
                  </li>
                ) : (
                  <li key={item.reserva.id}>
                    <Link
                      href={`/reservas/${item.reserva.id}`}
                      className="group flex items-stretch gap-3 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-xs transition-colors hover:border-primary/30 hover:bg-accent/40"
                    >
                      <span className="w-1 shrink-0 self-stretch rounded-full bg-ocupado" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold tabular-nums">
                          {item.inicio}–{item.fim}
                        </p>
                        <p className="truncate text-muted-foreground">
                          {item.reserva.nome_responsavel} · {item.reserva.setor}
                        </p>
                      </div>
                      <ChevronRightIcon className="size-4 self-center text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
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
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou setor"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 pl-9"
          />
        </div>

        {carregandoProximas ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : reservasProximas.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Nenhuma reserva encontrada.
          </div>
        ) : (
          <ul className="space-y-2">
            {reservasProximas.map((reserva) => {
              const dataReserva = new Date(`${reserva.data}T00:00:00`);
              return (
                <li key={reserva.id}>
                  <Link
                    href={`/reservas/${reserva.id}`}
                    className="group flex items-center gap-3 rounded-xl border bg-card px-3 py-3 text-sm shadow-xs transition-colors hover:border-primary/30 hover:bg-accent/40"
                  >
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                      <span className="text-base font-semibold leading-none tabular-nums">
                        {format(dataReserva, "dd")}
                      </span>
                      <span className="text-[0.65rem] uppercase text-muted-foreground">
                        {format(dataReserva, "MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {reserva.nome_responsavel}
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          {reserva.setor}
                        </span>
                      </p>
                      <p className="text-muted-foreground tabular-nums">
                        {format(dataReserva, "EEE", { locale: ptBR })} ·{" "}
                        {reserva.hora_inicio.slice(0, 5)}–
                        {reserva.hora_fim.slice(0, 5)}
                      </p>
                    </div>
                    {reserva.dia_inteiro && (
                      <Badge variant="secondary" className="shrink-0">
                        Dia inteiro
                      </Badge>
                    )}
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}
