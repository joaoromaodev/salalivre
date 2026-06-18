"use client";

import { useActionState } from "react";
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
    <Card className="w-full max-w-sm">
      <CardHeader>
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
            <Input
              id="senha"
              name="senha"
              type="password"
              autoFocus
              required
              autoComplete="current-password"
            />
          </div>
          {estado.erro && (
            <p role="alert" className="text-sm text-destructive">
              {estado.erro}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
