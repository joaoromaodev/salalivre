import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, tokenSessaoValido } from "@/lib/auth";

/**
 * Protege TODAS as rotas (páginas e API routes), inclusive a consulta
 * da agenda — sem cookie de sessão válido, redireciona para /login.
 * Não há níveis de permissão: só "tem a senha" ou "não tem".
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessaoValida = await tokenSessaoValido(token);

  if (!sessaoValida) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tudo, exceto assets estáticos do Next e o favicon.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
