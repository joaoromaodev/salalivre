# Desenvolvimento

## Setup local

Pré-requisitos: Node 20+ e um Postgres acessível (Neon serve).

```bash
npm install
cp .env.example .env.local        # preencha DATABASE_URL, APP_PASSWORD, COOKIE_SECRET
npm run db:migrate                 # cria o schema
npm run db:seed                    # (opcional) dados fictícios
npm run dev                        # http://localhost:3000
```

Gerar um `COOKIE_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts (`package.json`)

| Script | O que faz |
| ------ | --------- |
| `npm run dev` | Servidor de desenvolvimento (Next). |
| `npm run build` | Build de produção. |
| `npm run start` | Sobe o build de produção. |
| `npm run lint` | ESLint. |
| `npm run db:migrate` | Aplica `migrations/*.sql` (via `tsx --env-file=.env.local`). |
| `npm run db:seed` | Popula reservas fictícias. |

Checagens úteis antes de commitar: `npx tsc --noEmit` e `npx eslint .`.

## Telas (rotas)

| Rota | Acesso | Descrição |
| ---- | ------ | --------- |
| `/login` | pública | Campo de senha (Server Action `loginAction`). |
| `/agenda` | protegida | Calendário mensal (livre/parcial/cheio), grade do dia selecionado e aba "Próximas reservas" com busca. |
| `/novo` | protegida | Formulário de novo agendamento com feedback de disponibilidade em tempo real. |
| `/reservas/{id}` | protegida | Editar/cancelar (reaproveita o formulário; cancelar tem diálogo de confirmação). |
| `/qrcode` | protegida | Gera e imprime o QR da porta (aponta para `/sala`). |
| `/sala` | **pública** | Tela da porta: status "agora" (livre/ocupada), calendário e grade — só livre/ocupado, sem dados pessoais. Atualiza sozinha a cada 60s. |

## Componentes principais

| Componente | Papel |
| ---------- | ----- |
| `agenda-view.tsx` | Agenda interna (calendário + próximas + busca). Client Component que consome `/api/reservas`. |
| `agenda-publica.tsx` | Agenda pública (`/sala`). Consome `/api/publico/agenda`; calcula o "status agora". |
| `reserva-form.tsx` | Formulário de criar/editar. Campos de hora livres (`<input type="time">`), validação zod e `use-disponibilidade`. |
| `cancelar-reserva-button.tsx` | Cancelamento com `AlertDialog` de confirmação. |
| `qrcode-porta.tsx` | Gera o QR (lib `qrcode`) e imprime. |
| `app-nav.tsx` | Navegação: links no cabeçalho (desktop) e bottom navigation (mobile). |
| `theme-provider.tsx` / `theme-toggle.tsx` | Tema claro/escuro (`next-themes`). |
| `pwa-register.tsx` | Registra o service worker. |

## Lógica de negócio (onde está o quê)

| Assunto | Arquivo |
| ------- | ------- |
| Expediente (config central) | `src/config/agenda.ts` |
| Validação (zod, front+back) | `src/lib/validacao.ts` |
| Sobreposição/conflito (espelho do banco) | `src/lib/conflito.ts` |
| Status do dia + grade de horários | `src/lib/grade-dia.ts` |
| Queries (CRUD/consulta) | `src/lib/reservas.ts` |
| Detecção de `exclusion_violation` | `src/lib/db-erros.ts` |
| Sessão/HMAC | `src/lib/auth.ts` |

## Design system

- Tokens em `src/app/globals.css`: paleta minimalista (neutros slate + accent
  índigo), cores semânticas de status (`--livre`, `--parcial`, `--ocupado`,
  cada uma com uma `-surface`), tema claro e escuro (`.dark`).
- Componentes `shadcn/ui` em `src/components/ui/` (primitivos base-ui).
- Fontes Geist (Sans/Mono) via `next/font`.
- Mobile-first: alvos de toque ≥ 44px, bottom navigation, safe-areas.

## Convenções

- Nomes de campos seguem 1:1 as colunas do banco (`nome_responsavel`, `setor`,
  etc.) — sem camada de tradução entre front, API e banco.
- Datas/horas trafegam como **string** (`YYYY-MM-DD` / `HH:mm(:ss)`) de ponta a
  ponta, evitando timezone.
- Comentários no código explicam a lógica de range/conflito/tema onde ela não é
  óbvia.

## Fluxo de contribuição

1. Branch a partir de `main`.
2. Alterar; rodar `tsc`, `eslint` e `build`.
3. Se mexer no schema, criar uma **nova** migration (não editar as aplicadas).
4. Abrir PR (gera preview na Vercel) ou merge na `main` (republica produção).
