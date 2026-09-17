# Deploy e operação

## Variáveis de ambiente

| Variável | Obrigatória | Exemplo/Origem |
| -------- | ----------- | -------------- |
| `DATABASE_URL` | sim | Connection string do Postgres (Neon, Supabase, etc.). |
| `APP_PASSWORD` | sim | Senha única de acesso. |
| `COOKIE_SECRET` | sim | String longa e aleatória (assina o cookie). |

Localmente ficam em `.env.local` (no `.gitignore`). Há um `.env.example` com
placeholders. Na Vercel, ficam em **Project Settings → Environment Variables**
(ou via CLI, veja abaixo), definidas para os ambientes **Production** e
**Preview**.

## Banco (Neon)

1. Criar conta em [neon.tech](https://neon.tech) e um projeto/banco.
2. Copiar a connection string (com `sslmode=require`) para `DATABASE_URL`.
3. O `postgres.js` respeita o SSL embutido na URL automaticamente.

> Neon (free tier) faz **autosuspend**, mas dá **resume** sozinho na primeira
> conexão — o link nunca fica "morto".

### Trocar de provedor Postgres

Basta trocar `DATABASE_URL` (ex.: Supabase, RDS, Postgres local). Nenhuma
mudança de código: o app usa `postgres.js` puro, sem SDK proprietário. O
provedor precisa suportar as extensões `btree_gist` e `pgcrypto` (padrão na
maioria).

## Migrations e seed

```bash
npm run db:migrate   # aplica migrations/*.sql em ordem (idempotente)
npm run db:seed      # popula reservas fictícias (demo/local)
```

Ambos leem `DATABASE_URL` de `.env.local` (via `tsx --env-file`). Para rodar
contra produção, aponte `DATABASE_URL` para o banco de produção antes de
executar.

## Deploy na Vercel

O repositório está conectado à Vercel: **todo push na `main` republica em
produção** automaticamente; PRs geram deploys de **Preview**.

Via CLI (opcional):

```bash
npm i -g vercel
vercel login
vercel link                 # vincula a pasta ao projeto
vercel deploy --prod        # deploy de produção sob demanda
vercel deploy               # deploy de preview
```

Definir variáveis via CLI (exemplo para produção):

```bash
printf '%s' "<valor>" | vercel env add DATABASE_URL production
printf '%s' "<valor>" | vercel env add APP_PASSWORD production
printf '%s' "<valor>" | vercel env add COOKIE_SECRET production
```

Repita com `preview` no lugar de `production` para os deploys de PR.

## Operação do dia a dia

### Limpar dados para uso real

Depois de validar com o seed, esvaziar a tabela para começar limpo:

```sql
DELETE FROM reservas;
```

(Feito uma vez ao entrar em produção; o script de seed permanece no repo só para
demonstração/local.)

### Trocar a senha em produção

```bash
vercel env rm APP_PASSWORD production
printf '%s' "<nova senha>" | vercel env add APP_PASSWORD production
vercel deploy --prod
```

### Gerar/rotacionar o COOKIE_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Trocar o `COOKIE_SECRET` invalida todas as sessões ativas (todos precisam
logar de novo).

### QR code da porta

A página interna `/qrcode` gera o QR apontando para `<origin>/sala` usando a
origem atual (funciona em local, preview e produção sem configurar URL). Botão
de imprimir isola só o cartão (estilos `@media print`).

## Checklist de um novo ambiente

1. Criar banco e obter `DATABASE_URL`.
2. Definir `DATABASE_URL`, `APP_PASSWORD`, `COOKIE_SECRET`.
3. `npm run db:migrate`.
4. (Opcional) `npm run db:seed` para demo; ou deixar vazio para produção.
5. Deploy (`vercel deploy --prod` ou push na `main`).
6. Abrir `/login`, entrar, imprimir o QR em `/qrcode`.
