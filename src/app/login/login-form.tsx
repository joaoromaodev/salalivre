"use client";

import { useActionState } from "react";
import { CalendarCheckIcon, LockIcon } from "lucide-react";

import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ESTADO_INICIAL: LoginState = {};

export function LoginForm({ redirecionar }: { redirecionar?: string }) {
  const [estado, formAction, pendente] = useActionState(
    loginAction,
    ESTADO_INICIAL
  );

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="items-center text-center">
        <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <CalendarCheckIcon className="size-6" />
        </span>
        <CardTitle className="text-xl">SalaLivre</CardTitle>
        <CardDescription>
          Digite a senha de acesso para gerenciar a agenda da sala.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="redirecionar"
            value={redirecionar ?? "/agenda"}
          />
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="senha"
                name="senha"
                type="password"
                autoFocus
                required
                autoComplete="current-password"
                aria-invalid={Boolean(estado.erro)}
                className="h-11 pl-9"
              />
            </div>
          </div>
          {estado.erro && (
            <p role="alert" className="text-sm text-destructive">
              {estado.erro}
            </p>
          )}
          <Button
            type="submit"
            className="h-11 w-full text-sm"
            disabled={pendente}
          >
            {pendente ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
