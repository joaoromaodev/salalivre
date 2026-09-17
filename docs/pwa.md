# PWA (Progressive Web App)

O SalaLivre é instalável no celular (ícone na tela inicial, abertura em tela
cheia), pensado para a equipe usar no balcão.

## Componentes da PWA

| Arquivo | Papel |
| ------- | ----- |
| `src/app/manifest.ts` | Web manifest (servido em `/manifest.webmanifest`). |
| `public/sw.js` | Service worker. |
| `public/offline.html` | Tela mostrada em navegações sem rede. |
| `public/icons/*` | Ícones (192, 512, maskable, apple-touch). **Placeholder** — trocar pelo ícone final. |
| `src/components/pwa-register.tsx` | Registra o `/sw.js` no client após o load. |
| `src/app/layout.tsx` | Metadata: `appleWebApp`, ícones, `theme-color` (claro/escuro) e `viewportFit: cover` (safe-areas/notch). |

## Manifest

`display: standalone`, `orientation: portrait`, `start_url: /agenda`,
`theme_color: #4f46e5` (índigo), `background_color: #ffffff`. Como `start_url`
aponta para `/agenda` (rota protegida), quem abrir sem sessão cai no `/login`.

## Service worker

Estratégia **conservadora** e segura para um app autenticado (`public/sw.js`):

- **Nunca** faz cache de `/api/*` nem de HTML de navegação (conteúdo
  potencialmente sensível/personalizado sempre vem fresco da rede).
- **Cache-first** apenas de assets estáticos versionados (`/_next/static/*`) e
  dos ícones — seguros porque têm hash/são públicos.
- Em navegação sem rede, serve `/offline.html`.
- Só intercepta `GET` de mesma origem.

> **Dev vs. produção:** em produção cada deploy gera chunks com hash novo, então
> o cache-first sempre busca os arquivos novos. Em desenvolvimento o SW pode
> servir chunks antigos do cache e mascarar mudanças — se isso acontecer,
> limpe: em DevTools → Application → Service Workers → Unregister, e Application
> → Storage → Clear site data, depois recarregue.

## Como instalar

- **Android (Chrome):** abrir o site → menu ⋮ → "Instalar app" / "Adicionar à
  tela inicial".
- **iPhone (Safari):** abrir o site → Compartilhar → "Adicionar à Tela de
  Início".

## Pendências / melhorias

- Os **ícones são placeholders** (um fundo índigo com "linhas de agenda"). Para
  um ícone final: substituir `public/icons/*` (192, 512, maskable 512,
  apple-touch 180) e, se mudar a cor, atualizar `theme_color` no `manifest.ts`
  e o `themeColor` no `viewport` de `layout.tsx`.
- A tela `offline.html` é HTML/CSS puro (não usa o design system do app);
  ajustes visuais são manuais.
