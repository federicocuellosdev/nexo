# Nexo 3.0

Monorepo de Nexo 3.0. Contiene las dos aplicaciones del producto, cada una
independiente, con su propio `package.json`, sus tests y su build.

## Estructura

```
apps/
├── landing/   Sitio público: home, catálogo, fichas de plan y producto, términos
└── portal/    Portal del socio: ingreso, coberturas, pagos, credencial digital
```

Ambas son **Vite + React + React Router + TypeScript**, con tests en **Vitest**
y Testing Library.

## Requisitos

- Node `>=22`

## Puesta en marcha

Cada app se instala y se levanta por separado:

```bash
cd apps/landing && npm install && npm run dev   # http://localhost:5173
cd apps/portal  && npm install && npm run dev   # http://localhost:5174
```

## Comandos por app

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción |
| `npm run typecheck` | Sólo `tsc --noEmit` |
| `npm test` | Corre la suite completa de Vitest |
| `npm run test:watch` | Vitest en modo watch |

La landing además tiene `npm run e2e` (Playwright).

## Despliegue

Este repo es un monorepo sin workspaces: cada app se despliega como un proyecto
independiente. En Vercel hay que configurar el **Root Directory** de cada
proyecto:

- Proyecto de la landing → `apps/landing`
- Proyecto del portal → `apps/portal`

Sin eso el build falla, porque en la raíz del repo no hay `package.json`.

## Historial

Las dos apps se incorporaron con `git subtree`, así que el historial completo
de cada una está preservado dentro de este repo. Para ver los commits de una
sola:

```bash
git log --oneline -- apps/landing
git log --oneline -- apps/portal
```
