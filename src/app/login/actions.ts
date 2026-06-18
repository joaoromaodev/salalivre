"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  criarTokenSessao,
  senhaCorreta,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validacao";

export interface LoginState {
  erro?: string;
}

function destinoSeguro(valor: FormDataEntryValue | null): string {
  // Só aceita caminhos relativos internos, para evitar open redirect.
  if (typeof valor === "string" && valor.startsWith("/") && !valor.startsWith("//")) {
    return valor;
  }
  return "/agenda";
}

export async function loginAction(
  _estadoAnterior: LoginState,
  formData: FormData
): Promise<LoginState> {
  const resultado = loginSchema.safeParse({
    senha: formData.get("senha"),
  });

  if (!resultado.success) {
    return { erro: "Informe a senha." };
  }

  if (!(await senhaCorreta(resultado.data.senha))) {
    return { erro: "Senha incorreta." };
  }

  const token = await criarTokenSessao();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(destinoSeguro(formData.get("redirecionar")));
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
