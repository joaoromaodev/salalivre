"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";

import { AGENDA_CONFIG, gerarLimitesExpediente } from "@/config/agenda";
import { reservaInputSchema, reservaUpdateSchema } from "@/lib/validacao";
import type { Reserva } from "@/lib/reservas";
import { useDisponibilidade } from "@/hooks/use-disponibilidade";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LIMITES_EXPEDIENTE = gerarLimitesExpediente();
const OPCOES_INICIO = LIMITES_EXPEDIENTE.slice(0, -1);

function dataStringParaDate(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dateParaDataString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function inicioDoDiaDeHoje(): Date {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return agora;
}

interface ReservaFormProps {
  reservaExistente?: Reserva;
}

export function ReservaForm({ reservaExistente }: ReservaFormProps) {
  const router = useRouter();
  const editando = Boolean(reservaExistente);

  const [nomeResponsavel, setNomeResponsavel] = useState(
    reservaExistente?.nome_responsavel ?? ""
  );
  const [setor, setSetor] = useState(reservaExistente?.setor ?? "");
  const [matricula, setMatricula] = useState(reservaExistente?.matricula ?? "");
  const [data, setData] = useState<Date | undefined>(
    reservaExistente ? dataStringParaDate(reservaExistente.data) : undefined
  );
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [diaInteiro, setDiaInteiro] = useState(
    reservaExistente?.dia_inteiro ?? false
  );
  const [horaInicio, setHoraInicio] = useState(
    reservaExistente?.hora_inicio?.slice(0, 5) ?? ""
  );
  const [horaFim, setHoraFim] = useState(
    reservaExistente?.hora_fim?.slice(0, 5) ?? ""
  );
  const [observacao, setObservacao] = useState(
    reservaExistente?.observacao ?? ""
  );

  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const opcoesFim = useMemo(
    () =>
      LIMITES_EXPEDIENTE.filter(
        (h) => h > (horaInicio || AGENDA_CONFIG.EXPEDIENTE_INICIO)
      ),
    [horaInicio]
  );

  useEffect(() => {
    if (horaFim && horaFim <= horaInicio) {
      setHoraFim("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horaInicio]);

  const dataString = data ? dateParaDataString(data) : undefined;
  const horaInicioEfetivo = diaInteiro
    ? AGENDA_CONFIG.EXPEDIENTE_INICIO
    : horaInicio;
  const horaFimEfetivo = diaInteiro ? AGENDA_CONFIG.EXPEDIENTE_FIM : horaFim;

  const { status: statusDisponibilidade, conflitos } = useDisponibilidade({
    data: dataString,
    horaInicio: horaInicioEfetivo || undefined,
    horaFim: horaFimEfetivo || undefined,
    excluirId: reservaExistente?.id,
  });

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();

    const payload = {
      nome_responsavel: nomeResponsavel,
      setor,
      matricula: matricula || undefined,
      data: dataString ?? "",
      dia_inteiro: diaInteiro,
      hora_inicio: horaInicioEfetivo || "",
      hora_fim: horaFimEfetivo || "",
      observacao: observacao || undefined,
    };

    const schema = editando ? reservaUpdateSchema : reservaInputSchema;
    const resultado = schema.safeParse(payload);

    if (!resultado.success) {
      const novosErros: Record<string, string> = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (typeof campo === "string" && !novosErros[campo]) {
          novosErros[campo] = issue.message;
        }
      }
      setErros(novosErros);
      toast.error("Confira os campos destacados.");
      return;
    }

    setErros({});
    setEnviando(true);
    try {
      const resposta = await fetch(
        editando ? `/api/reservas/${reservaExistente!.id}` : "/api/reservas",
        {
          method: editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resultado.data),
        }
      );

      const json = await resposta.json();

      if (!resposta.ok) {
        toast.error(json.error ?? "Não foi possível salvar a reserva.");
        return;
      }

      toast.success(editando ? "Reserva atualizada." : "Reserva criada com sucesso.");
      router.push("/agenda");
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const mostrarStatusDisponibilidade = Boolean(
    dataString && horaInicioEfetivo && horaFimEfetivo
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nome_responsavel">Nome do responsável</Label>
        <Input
          id="nome_responsavel"
          value={nomeResponsavel}
          onChange={(e) => setNomeResponsavel(e.target.value)}
          aria-invalid={Boolean(erros.nome_responsavel)}
          required
        />
        {erros.nome_responsavel && (
          <p className="text-sm text-destructive">{erros.nome_responsavel}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="setor">Setor</Label>
          <Input
            id="setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            aria-invalid={Boolean(erros.setor)}
            required
          />
          {erros.setor && (
            <p className="text-sm text-destructive">{erros.setor}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula (opcional)</Label>
          <Input
            id="matricula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data</Label>
        <Popover open={calendarioAberto} onOpenChange={setCalendarioAberto}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
              />
            }
          >
            <CalendarIcon className="size-4" />
            {data
              ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : "Selecione uma data"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data}
              onSelect={(novaData) => {
                setData(novaData);
                setCalendarioAberto(false);
              }}
              disabled={editando ? undefined : { before: inicioDoDiaDeHoje() }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {erros.data && <p className="text-sm text-destructive">{erros.data}</p>}
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
        <div>
          <Label htmlFor="dia_inteiro">Dia inteiro</Label>
          <p className="text-sm text-muted-foreground">
            Ocupa o expediente todo ({AGENDA_CONFIG.EXPEDIENTE_INICIO}–
            {AGENDA_CONFIG.EXPEDIENTE_FIM})
          </p>
        </div>
        <Switch
          id="dia_inteiro"
          checked={diaInteiro}
          onCheckedChange={setDiaInteiro}
        />
      </div>

      {!diaInteiro && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="hora_inicio">Início</Label>
            <Select
              value={horaInicio}
              onValueChange={(valor) => setHoraInicio(valor ?? "")}
            >
              <SelectTrigger id="hora_inicio" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_INICIO.map((hora) => (
                  <SelectItem key={hora} value={hora}>
                    {hora}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.hora_inicio && (
              <p className="text-sm text-destructive">{erros.hora_inicio}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora_fim">Término</Label>
            <Select
              value={horaFim}
              onValueChange={(valor) => setHoraFim(valor ?? "")}
              disabled={!horaInicio}
            >
              <SelectTrigger id="hora_fim" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFim.map((hora) => (
                  <SelectItem key={hora} value={hora}>
                    {hora}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.hora_fim && (
              <p className="text-sm text-destructive">{erros.hora_fim}</p>
            )}
          </div>
        </div>
      )}

      {mostrarStatusDisponibilidade && (
        <div
          className={
            statusDisponibilidade === "conflito"
              ? "rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              : statusDisponibilidade === "livre"
                ? "rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-500"
                : "rounded-lg border px-3 py-2.5 text-sm text-muted-foreground"
          }
        >
          {statusDisponibilidade === "verificando" && (
            <span className="flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Verificando disponibilidade...
            </span>
          )}
          {statusDisponibilidade === "livre" && (
            <span className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4" />
              Horário livre.
            </span>
          )}
          {statusDisponibilidade === "conflito" && (
            <div className="space-y-1">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangleIcon className="size-4" />
                Conflita com {conflitos.length === 1 ? "esta reserva" : "estas reservas"}:
              </span>
              <ul className="list-inside list-disc pl-1">
                {conflitos.map((conflito) => (
                  <li key={conflito.id}>
                    {conflito.setor} — {conflito.nome_responsavel} (
                    {conflito.hora_inicio.slice(0, 5)}–
                    {conflito.hora_fim.slice(0, 5)})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {statusDisponibilidade === "erro" && (
            <span>Não foi possível checar a disponibilidade agora.</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={enviando || statusDisponibilidade === "conflito"}
          className="flex-1"
        >
          {enviando
            ? "Salvando..."
            : editando
              ? "Salvar alterações"
              : "Criar agendamento"}
        </Button>
        <Button type="button" variant="outline" render={<Link href="/agenda" />}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
