# Documentação — SalaLivre

Documentação técnica completa do **SalaLivre**, sistema web de agendamento de
uma sala de reunião única e de uso exclusivo.

Para uma visão de alto nível (descrição, screenshots, setup rápido e deploy),
veja o [`README.md`](../README.md) na raiz do projeto. Esta pasta aprofunda a
parte técnica.

## Índice

| Documento | Conteúdo |
| --------- | -------- |
| [Arquitetura](./arquitetura.md) | Visão geral, stack, estrutura de pastas, camadas e fluxo de uma requisição. |
| [Modelo de dados](./modelo-de-dados.md) | Tabela `reservas`, colunas, constraints, a exclusion constraint e as migrations. |
| [Regras de negócio](./regras-de-negocio.md) | Expediente, sobreposição, dia inteiro, agendamento na hora e a dupla validação (front + banco). |
| [Referência da API](./api.md) | Todos os endpoints (internos e público), parâmetros, respostas e códigos de status. |
| [Segurança e acesso](./seguranca-e-acesso.md) | Senha única, cookie de sessão assinado, middleware, rotas públicas e LGPD. |
| [PWA](./pwa.md) | Manifest, service worker, ícones, tela offline e instalação no celular. |
| [Deploy e operação](./deploy-e-operacao.md) | Variáveis de ambiente, Neon, Vercel, migrations, seed, troca de provedor e limpeza de dados. |
| [Desenvolvimento](./desenvolvimento.md) | Setup local, scripts, telas e componentes. |

## Resumo em uma frase

Next.js 15 (App Router) + TypeScript, Tailwind v4 + shadcn/ui, PostgreSQL via
`postgres.js` (recomendado: Neon), deploy na Vercel. Acesso por **senha única
compartilhada**; a garantia contra reserva em dobro é uma **exclusion
constraint** no banco. Há uma **tela pública** (`/sala`) para consulta via QR
code, sem expor dados pessoais, e o app é uma **PWA instalável**.
