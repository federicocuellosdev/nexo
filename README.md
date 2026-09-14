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
de cada una está preservado dentro de este repo (122 commits en total: 70 de la
landing, 49 del portal, más el commit inicial y los dos merges de importación).

`git blame` cruza el límite de la importación sin problema, así que la
arqueología de código funciona normal:

```bash
git blame apps/landing/src/pages/Home.tsx
```

Lo que **no** funciona es filtrar el log por ruta. Los commits anteriores a la
importación guardan sus rutas originales (`src/pages/Home.tsx`, no
`apps/landing/src/pages/Home.tsx`), así que `git log -- apps/landing` sólo
devuelve el commit de merge. Para recorrer el historial previo de cada app hay
dos tags que apuntan a la cabeza de cada repo original:

```bash
git log --oneline historia/landing
git log --oneline historia/portal
```
