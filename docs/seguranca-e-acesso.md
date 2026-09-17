# Segurança e acesso

## Modelo de acesso

Não há contas de usuário nem níveis de permissão. O acesso é controlado por uma
**senha única compartilhada** (`APP_PASSWORD`). Quem tem a senha pode consultar,
criar, editar e cancelar. Contexto de uso: uma equipe gestora cadastra as
reservas em nome de quem vai usar a sala — a pessoa que usa a sala não acessa o
sistema.

## Fluxo de autenticação

1. `/login` mostra um campo de senha (`src/app/login/`).
2. O submit chama a **Server Action** `loginAction` (`login/actions.ts`), que:
   - valida com `loginSchema` (zod);
   - compara a senha com `APP_PASSWORD` **no servidor**, em tempo constante
     (comparando hashes SHA-256, não as strings — evita timing attack);
   - se correta, gera um token de sessão e grava o cookie.
3. Redireciona para o destino original (parâmetro `redirecionar`, sempre um
   caminho interno — proteção contra open redirect).

A senha **nunca** é exposta ao client: a comparação é server-side e o cookie
carrega apenas um token assinado.

## Cookie de sessão

Definido em `src/lib/auth.ts`:

| Item | Valor |
| ---- | ----- |
| Nome | `salalivre_session` |
| Conteúdo | `payloadBase64.assinaturaBase64` — payload `{ exp }` + HMAC-SHA256 |
| Assinatura | HMAC-SHA256 com `COOKIE_SECRET` (Web Crypto API) |
| Validade | 7 dias (`exp` embutido no payload) |
| Flags | `httpOnly`, `sameSite=lax`, `path=/`, `secure` em produção |

O uso da **Web Crypto API** (em vez do módulo `crypto` do Node) permite validar
o token tanto no **middleware** (Edge runtime) quanto em Server Actions/rotas
(Node runtime). A validação (`tokenSessaoValido`) confere assinatura **e**
expiração.

## Middleware

`src/middleware.ts` protege **todas** as rotas (páginas e API), inclusive a
consulta interna da agenda. Sem cookie válido:

- Páginas → `307` redirect para `/login?redirecionar=<caminho>`.
- `/api/*` → `401 { "error": "Não autenticado." }`.

### Rotas liberadas (sem sessão)

- `/login` — tela de autenticação.
- `/sala` — tela pública da porta (read-only).
- `/api/publico/*` — API da tela pública.
- Assets da PWA: `/manifest.webmanifest`, `/sw.js`, `/offline.html`, `/icons/*`.

O `matcher` do middleware já exclui `_next/static`, `_next/image` e
`favicon.ico`.

## Privacidade e LGPD

- A tela pública (`/sala`) e sua API (`/api/publico/agenda`) expõem **apenas**
  horários livres/ocupados. A query (`listarOcupacaoDoMes`) nem seleciona
  nome, setor ou matrícula — não há dado pessoal disponível para quem não tem a
  senha.
- Segredos nunca vão para o repositório: `.env.local` está no `.gitignore`; há
  um `.env.example` com placeholders.
- O seed usa dados 100% fictícios (nomes inventados, "Setor A", "Setor B").

## Segredos e variáveis sensíveis

| Variável | Papel |
| -------- | ----- |
| `APP_PASSWORD` | Senha única de acesso. |
| `COOKIE_SECRET` | Chave HMAC que assina o cookie de sessão. Deve ser longa e aleatória. |
| `DATABASE_URL` | Connection string do Postgres (contém credenciais). |

Gerar um `COOKIE_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Trocar qualquer um desses valores em produção invalida o efeito anterior
(trocar `COOKIE_SECRET` desloga todo mundo; trocar `APP_PASSWORD` muda a senha).

## Camada de proteção da Vercel

O **Vercel Authentication** (proteção de deployments) foi **desativado** neste
projeto, porque o app já tem a própria proteção por senha e essa camada extra
bloqueava os previews e a tela pública `/sala`. Se quiser reativá-la, lembre que
ela passaria a exigir login da Vercel também na tela da porta.
