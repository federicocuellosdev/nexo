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

## Flujo de trabajo diario

Git no sincroniza solo: los cambios llegan a GitHub cuando vos los mandás.

```bash
# 1. Traer lo último antes de empezar
git pull

# 2. Trabajar. Levantar la app que toque:
cd apps/landing && npm run dev    # http://localhost:5173
cd apps/portal  && npm run dev    # http://localhost:5174

# 3. Antes de commitear, que la app que tocaste esté en verde
npm run typecheck && npm test

# 4. Commitear por unidad de trabajo, no por archivo suelto
git add <archivos>
git commit -m "feat(ambito): lo que se logró"

# 5. Subir
git push
```

### Antes del primer push del día

El push usa **la cuenta de GitHub activa en `gh`**, y hay varias configuradas en
la máquina. Sólo una tiene permiso de escritura:

```bash
gh api user --jq '.login'              # tiene que decir: previncanexo
gh auth switch --user previncanexo     # si dice otra cosa
```

Si pushea con la cuenta equivocada, GitHub responde 403 sin más explicación.

### Convención de commits

Conventional commits **en español**, describiendo el resultado y no la lista de
archivos:

```
feat(credencial): credencial digital descargable con QR de verificacion
fix(a11y): permitir elegir el nivel de encabezado de EmptyState
```

Un commit = una unidad de trabajo terminada, con sus tests incluidos. Si el
repo no compila después de aplicar sólo ese commit, el commit está mal cortado.

### Los datos de planes están duplicados a propósito

`src/mock/planes.ts` existe igual en las dos apps y un test los compara **byte a
byte** (`apps/portal/src/mock/planes.paridad.test.ts`). Si tocás precios o
prestaciones en una, replicalo en la otra o los tests fallan. Es a propósito:
evita que el comparador de la landing y el pago del portal muestren números
distintos.

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
