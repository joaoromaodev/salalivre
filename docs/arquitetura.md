# Arquitetura

## Visão geral

O SalaLivre é uma aplicação **Next.js 15 (App Router)** full-stack: as telas
(React Server/Client Components), as API routes e o middleware de autenticação
vivem no mesmo projeto e são publicados juntos na Vercel. O estado persistente
fica em um **PostgreSQL** acessado diretamente por `postgres.js` (sem ORM e sem
SDK proprietário de provedor), então o banco pode ser trocado apenas alterando
a `DATABASE_URL`.

Não há contas de usuário: o acesso é controlado por uma **senha única
compartilhada** e um cookie de sessão assinado, verificados no middleware.

```
Navegador (equipe / tela da porta)
        │
        ▼
Next.js middleware  ──►  sem sessão? redireciona /login (ou 401 em /api)
        │  (rotas públicas: /login, /sala, /api/publico/*, assets da PWA)
        ▼
App Router
  ├─ Server Components (páginas)         ── leem o banco direto (lib/reservas)
  ├─ Client Components (formulário, etc.)── chamam as API routes via fetch
  └─ API routes (/api/*)                 ── validam (zod) e chamam lib/reservas
        │
        ▼
lib/reservas (queries) ──► db/client (postgres.js) ──► PostgreSQL (Neon)
                                                         exclusion constraint
```

## Stack

| Camada | Tecnologia |
| ------ | ---------- |
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (primitivos [base-ui](https://base-ui.com)) |
| Tema claro/escuro | `next-themes` |
| Calendário | `react-day-picker` |
| Toasts | `sonner` |
| Validação | `zod` (compartilhada front + back) |
| QR code | `qrcode` (gerado no client) |
| Banco | PostgreSQL via [`postgres`](https://github.com/porsager/postgres) |
| Banco recomendado | [Neon](https://neon.tech) (free tier, autosuspend com resume automático) |
| Deploy | Vercel |

## Estrutura de pastas

```
migrations/                 # SQL puro, versionado
  001_init.sql               # schema, extensões, constraints, exclusion constraint
  002_remove_buffer.sql      # remove o buffer entre reservas
scripts/
  migrate.ts                 # aplica as migrations em ordem (via DATABASE_URL)
  seed.ts                    # popula reservas fictícias (demo/local)
public/
  icons/                     # ícones da PWA (placeholder)
  sw.js                      # service worker
  offline.html               # tela offline da PWA
src/
  config/agenda.ts           # configuração central (expediente)
  db/client.ts               # cliente postgres.js (singleton)
  lib/
    auth.ts                  # sessão por senha única (cookie HMAC)
    validacao.ts             # schemas zod (login + reserva)
    conflito.ts              # checagem de sobreposição em JS (espelha o banco)
    reservas.ts              # queries de CRUD e consulta
    grade-dia.ts             # status do dia + grade de horários
    db-erros.ts              # detecção da exclusion_violation (23P01)
    utils.ts                 # cn() (clsx + tailwind-merge)
  hooks/
    use-disponibilidade.ts   # feedback de disponibilidade em tempo real
  middleware.ts              # protege as rotas; libera /sala, /api/publico e PWA
  app/
    layout.tsx               # root layout (tema, PWA, fontes, metadata)
    manifest.ts              # web manifest da PWA
    globals.css              # tokens de design (paleta, status, tema)
    login/                   # tela de login + server action
    sala/                    # tela PÚBLICA da porta (read-only)
    (protected)/             # grupo protegido: agenda, novo, editar, qrcode
    api/
      reservas/              # CRUD interno
      disponibilidade/       # checagem de conflito (interno)
      publico/agenda/        # ocupação sem dados pessoais (público)
  components/
    ui/                      # componentes shadcn/ui
    agenda-view.tsx          # agenda interna (calendário + próximas)
    agenda-publica.tsx       # agenda pública (/sala)
    reserva-form.tsx         # formulário de criar/editar
    cancelar-reserva-button.tsx
    qrcode-porta.tsx         # gera e imprime o QR
    app-nav.tsx              # navegação (desktop + bottom nav mobile)
    theme-provider.tsx / theme-toggle.tsx
    pwa-register.tsx         # registra o service worker
```

## Camadas e responsabilidades

- **Configuração** (`src/config/agenda.ts`): fonte única do expediente. Precisa
  ficar em sincronia manual com os `CHECK` do SQL (as migrations comentam isso).
- **Acesso a dados** (`src/lib/reservas.ts` + `src/db/client.ts`): todas as
  queries SQL. O cliente `postgres.js` é um singleton reaproveitado entre
  hot-reloads para não esgotar o pool do Neon.
- **Regras de negócio** (`src/lib/validacao.ts`, `conflito.ts`, `grade-dia.ts`):
  validação com zod, checagem de sobreposição em JS (espelho do banco) e cálculo
  da grade/status do dia.
- **Apresentação** (`src/app/**`, `src/components/**`): Server Components leem o
  banco direto; Client Components conversam com as API routes.
- **Autenticação** (`src/middleware.ts` + `src/lib/auth.ts`): protege tudo,
  menos as rotas públicas.

## Fluxo de uma requisição

### Consulta da agenda (interna)
1. `GET /agenda` passa pelo middleware → cookie de sessão válido? Se não,
   redireciona para `/login`.
2. A página (Client Component `AgendaView`) faz `fetch` em
   `GET /api/reservas?mes=YYYY-MM`.
3. A API route chama `listarReservasDoMes` → `postgres.js` → PostgreSQL.
4. O componente calcula o status de cada dia (`grade-dia.ts`) e renderiza.

### Criação de uma reserva
1. `ReservaForm` valida com zod no client e mostra o status de disponibilidade
   em tempo real (`use-disponibilidade` → `GET /api/disponibilidade`).
2. Ao enviar, faz `POST /api/reservas` com o corpo JSON.
3. A API route revalida com o **mesmo** schema zod e chama `criarReserva`.
4. Se a `INSERT` violar a exclusion constraint (SQLSTATE `23P01`), a rota
   responde **409** com mensagem amigável; senão, **201** com a reserva criada.

### Consulta pública (tela da porta)
1. `GET /sala` é rota pública (liberada no middleware).
2. `AgendaPublica` faz `fetch` em `GET /api/publico/agenda?mes=YYYY-MM`.
3. A query devolve **apenas** `data`, `dia_inteiro`, `hora_inicio`, `hora_fim`
   — sem nome, setor ou matrícula.
