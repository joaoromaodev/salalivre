/**
 * Sessão por senha única compartilhada (sem contas de usuário).
 *
 * O cookie de sessão nunca guarda a senha — apenas um token assinado
 * com HMAC-SHA256 usando COOKIE_SECRET, com expiração embutida no
 * próprio payload. Implementado com a Web Crypto API (em vez do
 * módulo `crypto` do Node) para funcionar tanto no middleware (Edge
 * runtime) quanto em rotas/Server Actions (Node runtime).
 */

export const SESSION_COOKIE_NAME = "salalivre_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "COOKIE_SECRET não definida. Configure-a em .env.local (veja .env.example)."
    );
  }
  return secret;
}

function getAppPassword(): string {
  const senha = process.env.APP_PASSWORD;
  if (!senha) {
    throw new Error(
      "APP_PASSWORD não definida. Configure-a em .env.local (veja .env.example)."
    );
  }
  return senha;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getCookieSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function paraBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binario = "";
  for (const byte of arr) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(valor: string): Uint8Array<ArrayBuffer> {
  const base64 = valor
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(valor.length / 4) * 4, "=");
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

/** Gera um token de sessão assinado, válido por SESSION_MAX_AGE_SECONDS. */
export async function criarTokenSessao(): Promise<string> {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const payloadBase64 = paraBase64Url(new TextEncoder().encode(payload).buffer);

  const chave = await getHmacKey();
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(payloadBase64)
  );

  return `${payloadBase64}.${paraBase64Url(assinatura)}`;
}

/** Valida assinatura e expiração de um token de sessão. */
export async function tokenSessaoValido(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  const [payloadBase64, assinaturaBase64] = token.split(".");
  if (!payloadBase64 || !assinaturaBase64) return false;

  try {
    const chave = await getHmacKey();
    const assinaturaValida = await crypto.subtle.verify(
      "HMAC",
      chave,
      deBase64Url(assinaturaBase64),
      new TextEncoder().encode(payloadBase64)
    );
    if (!assinaturaValida) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(deBase64Url(payloadBase64))
    );
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

async function sha256(texto: string): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto)
  );
  return new Uint8Array(buffer);
}

/** Compara dois hashes de tamanho fixo sem early-exit (evita timing attack). */
function compararEmTempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a[i] ^ b[i];
  }
  return diferenca === 0;
}

/**
 * Compara a senha informada com APP_PASSWORD em tempo constante
 * (compara hashes SHA-256 de tamanho fixo, não as strings originais).
 */
export async function senhaCorreta(senha: string): Promise<boolean> {
  const [hashInformado, hashEsperado] = await Promise.all([
    sha256(senha),
    sha256(getAppPassword()),
  ]);
  return compararEmTempoConstante(hashInformado, hashEsperado);
}
