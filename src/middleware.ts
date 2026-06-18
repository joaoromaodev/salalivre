import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, tokenSessaoValido } from "@/lib/auth";

/**
 * Rotas liberadas sem sessão:
 * - /login: tela de autenticação.
 * - /sala e /api/publico/*: visão pública e read-only da ocupação da
 *   sala (a "tela da porta" acessada via QR code). Mostra só os
 *   horários ocupados, nunca dados pessoais nem ações de escrita.
 * - Assets da PWA (manifest, service worker, página offline e ícones):
 *   precisam ser acessíveis sem sessão para o app ser instalável e o
 *   SW registrar; não contêm dado sensível.
 */
const ARQUIVOS_PWA_PUBLICOS = new Set([
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
]);

function ehRotaPublica(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/sala" ||
    pathname.startsWith("/api/publico/") ||
    pathname.startsWith("/icons/") ||
    ARQUIVOS_PWA_PUBLICOS.has(pathname)
  );
}

/**
 * Protege TODAS as rotas (páginas e API routes), inclusive a consulta
 * interna da agenda — sem cookie de sessão válido, redireciona para
 * /login. Não há níveis de permissão: só "tem a senha" ou "não tem".
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ehRotaPublica(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessaoValida = await tokenSessaoValido(token);

  if (!sessaoValida) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
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
