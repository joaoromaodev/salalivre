# SalaLivre

Sistema web de agendamento para **uma sala de reunião de uso exclusivo**
(nunca dividida entre dois grupos ao mesmo tempo). Pensado para um setor que
gerencia a sala em nome de quem vai usá-la — não há contas de usuário, só uma
senha única compartilhada pela equipe gestora.

> Projeto de portfólio com uso real interno: todo o código é público, mas
> nenhum dado real (nomes, setores, senhas) aparece em lugar nenhum do
> repositório — veja [Privacidade e dados](#privacidade-e-dados-lgpd).

## Por que este projeto

A peça central é garantir, **no banco de dados**, que a sala nunca seja
reservada em dobro — mesmo se duas pessoas da equipe cadastrarem reservas ao
mesmo tempo a partir de celulares diferentes. Isso é feito com uma
[`EXCLUDE` constraint](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-EXCLUDE)
do PostgreSQL sobre um intervalo de tempo (`tsrange`) que já embute o buffer
de tolerância entre reservas — não é uma validação só de front-end.

## Screenshots

> _Adicione capturas de tela aqui após o primeiro deploy:_
> `docs/screenshot-login.png`, `docs/screenshot-agenda.png`,
> `docs/screenshot-novo.png`.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **PostgreSQL** via [`postgres`](https://github.com/porsager/postgres) (não
  usa SDK proprietário de nenhum provedor — só uma connection string)
- Banco recomendado: **[Neon](https://neon.tech)** (free tier; faz
  autosuspend mas resume sozinho na primeira conexão, então o link nunca fica
  "morto")
- Deploy: **Vercel**

## Funcionalidades

- **Novo agendamento**: formulário com feedback de disponibilidade em tempo
  real, antes mesmo de submeter.
- **Agenda**: calendário mensal com indicação visual por dia (livre /
  parcial / cheio), grade do expediente do dia selecionado e lista de
  próximas reservas com busca por nome ou setor.
- **Editar / cancelar**: a partir de qualquer reserva listada, com
  confirmação antes de cancelar.
- **Acesso por senha única**: todas as rotas — inclusive a consulta da
  agenda — exigem um cookie de sessão assinado; sem ele, redireciona para
  `/login`.

## Regras de negócio

Configuração central em [`src/config/agenda.ts`](src/config/agenda.ts):

| Parâmetro             | Valor padrão  |
| ---------------------- | ------------- |
| Expediente              | 08:00 – 17:00 |
| Tamanho do slot          | 30 minutos    |
| Buffer entre reservas    | 10 minutos    |

- A sala é exclusiva: duas reservas nunca podem se sobrepor no mesmo dia.
- O buffer "incha" o fim de cada reserva — uma reserva 14:00–15:00 bloqueia,
  na prática, até 15:10, para dar tempo de um grupo sair e o outro entrar.
- "Dia inteiro" é só uma reserva que ocupa o expediente todo (08:00–17:00).
- Não é possível criar reserva em data/horário no passado (mas o histórico
  continua visível e pode ser consultado).

Essas regras são validadas no formulário (feedback rápido) **e** garantidas
no banco via `CHECK`/`EXCLUDE` constraints — a validação de front nunca é a
única linha de defesa. Veja [`migrations/001_init.sql`](migrations/001_init.sql).

## Estrutura de pastas

```
migrations/             # SQL puro, versionado (schema + exclusion constraint)
scripts/
  migrate.ts             # aplica as migrations via DATABASE_URL
  seed.ts                 # popula reservas fictícias para demonstração
src/
  config/agenda.ts         # expediente, slot e buffer centralizados
  db/client.ts              # cliente postgres.js (DATABASE_URL)
  lib/
    auth.ts                  # sessão por senha única (cookie assinado)
    validacao.ts              # schemas zod compartilhados front/back
    conflito.ts                # checagem de conflito em JS (espelha o banco)
    reservas.ts                 # queries de CRUD
    grade-dia.ts                 # status do dia + grade de horários
  middleware.ts              # protege todas as rotas
  app/
    login/                    # tela de login
    (protected)/                # agenda, novo agendamento, editar/cancelar
    api/                          # rotas de reservas e disponibilidade
  components/                   # formulário de reserva, calendário, etc.
```

## Rodando localmente

### 1. Banco de dados (Neon)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) e um novo
   projeto/banco.
2. Copie a connection string (formato
   `postgres://usuario:senha@host/banco?sslmode=require`).

Qualquer outro Postgres funciona do mesmo jeito — basta trocar
`DATABASE_URL`. Não há nada específico de provedor no código (não usa
`@supabase/supabase-js` nem SDKs proprietários, só `postgres.js` puro).

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `DATABASE_URL`, `APP_PASSWORD` (a senha de acesso ao sistema) e
`COOKIE_SECRET` (um valor aleatório longo — `openssl rand -base64 32` gera
um bom valor).

### 3. Instalar dependências, migrar e popular

```bash
npm install
npm run db:migrate   # cria a tabela reservas + exclusion constraint
npm run db:seed       # opcional: popula reservas fictícias de demonstração
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — você será redirecionado
para `/login`.

## Deploy na Vercel

1. Suba o repositório no GitHub e importe o projeto na
   [Vercel](https://vercel.com/new).
2. Configure as variáveis de ambiente do projeto na Vercel:
   `DATABASE_URL`, `APP_PASSWORD`, `COOKIE_SECRET`.
3. Antes (ou depois) do primeiro deploy, rode a migration apontando para o
   banco de produção:
   ```bash
   DATABASE_URL="<connection string de produção>" npm run db:migrate
   ```
4. Deploy. Pronto — o middleware já protege todas as rotas em produção.

## Privacidade e dados (LGPD)

- Nenhum dado real (nome, setor, matrícula) existe neste repositório — o
  script de seed usa apenas nomes inventados e setores genéricos (`Setor A`,
  `Setor B`...).
- `.env.local` nunca é commitado (`.gitignore`); apenas `.env.example` com
  placeholders.
- A senha de acesso (`APP_PASSWORD`) nunca é exposta ao cliente — a
  comparação acontece só no servidor, e o cookie de sessão carrega apenas um
  token assinado (HMAC), nunca a senha em si.
- Use este projeto como referência/template; ao colocar dados reais de
  pessoas em produção, trate a base conforme a política de dados do seu
  setor/instituição.

## Licença

[MIT](LICENSE).
