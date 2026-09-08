# Nexo 3.0 — Landing

Maqueta clickeable de la sección pública de Nexo 3.0: Home, Catálogo (planes y
productos on demand), fichas de detalle y el flujo de alta hasta "Revisá tu
mail". Frontend nuevo, construido desde cero. Sin backend, sin base de datos y
sin autenticación real: todo lo que hoy parece "guardar" o "enviar un mail" es
simulado con `sessionStorage` y una URL de callback.

## Contexto

Rama huérfana `nexo-3.0`: no comparte historia ni código con `main` / `staging`
(Nexo 2.0, la app actual en producción). El código de este repo es nuevo desde
cero — no se importa nada de Nexo 2.0 — pero sí se heredan, a propósito, dos
cosas de ahí:

- La **identidad visual**: paleta, tipografía, radios, sombras y el patrón de
  iconos sobre degradado (acordado con Federico Cuellos el 2026-09-03).
- Los **datos de planes**: Nexo I / II / III, sus prestaciones y los productos
  on demand, portados como datos puros en `src/mock/planes.ts` (no como
  componentes).

`docs/referencia/` guarda el CSS y los datos originales de Nexo 2.0 como
referencia de lectura; nada de ahí se importa en tiempo de build.

El backend (Salesforce, Magic Link, Supabase, MercadoPago) lo conecta Federico
en una fase posterior. El portal de administración privado está pospuesto y no
se diseña en este repo.

## Stack

- **Build:** Vite 7
- **UI:** React 19 + TypeScript 5.9 (`strict`, sin `any`)
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing:** React Router 7
- **Primitivos accesibles:** Radix UI (`react-dialog`, `react-tabs`)
- **Iconos:** lucide-react
- **Tests:** Vitest 4 + Testing Library (React, DOM, user-event) sobre jsdom
- **E2E (todavía sin correr, ver "Pendientes"):** Playwright

Requiere **Node ≥ 22** y **npm** (no hay `pnpm` en el flujo de este repo).

## Empezar

```bash
npm install
cp .env.example .env      # opcional: ver "Variables de entorno" abajo
npm run dev                # http://localhost:5173
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm test` | Corre toda la suite de Vitest una vez. |
| `npm run test:watch` | Vitest en modo watch. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run build` | `tsc --noEmit` + build de producción con Vite. |
| `npm run preview` | Sirve el build de `npm run build` (para probarlo localmente). |
| `npm run e2e` | Playwright — **no corre todavía**, ver "Pendientes". |

## Variables de entorno

| Variable | Default en dev | Para qué |
| --- | --- | --- |
| `VITE_PORTAL_URL` | `http://localhost:5174` | Origen del portal privado. Se usa para el botón "Ingresar" del top bar / pie y para construir la URL de callback del Magic Link simulado (ver `src/lib/urls.ts`). |

`.env.example` documenta esta variable; copiala a `.env` si el portal corre en
otro puerto u origen. En producción la define quien despliegue (el subdominio
o carpeta final de la sección privada todavía no está decidido, spec §12).

## Rutas

Todas viven bajo `PublicLayout` (top bar + pie con la marca):

| Ruta | Página | Qué muestra |
| --- | --- | --- |
| `/` | `Home` | Hero, cómo funciona, planes destacados, productos on demand, FAQ. |
| `/catalogo` | `Catalogo` | Planes y productos en pestañas. La pestaña activa vive en la URL: `/catalogo?tab=productos` abre directo en Productos. |
| `/planes/:slug` | `FichaPlan` | Detalle de un plan: prestaciones, comparador contra los otros planes, CTA de contratar. |
| `/productos/:id` | `FichaProducto` | Detalle de un producto on demand (requiere plan activo). |
| `/revisa-tu-mail` | `RevisaTuMail` | Paso posterior al alta o al login: vista previa del "mail" con el enlace de acceso simulado. |
| cualquier otra | `NoEncontrada` | 404 con marca (top bar y pie incluidos), no el error genérico de React Router. |

## El flujo de alta y el handoff al portal

"Contratar" abre un popup (`AltaDialog`) que pide nombre, apellido, email y
teléfono — el plan o producto elegido viaja oculto, nunca es un campo que la
persona complete. Al enviar (o al usar "Ya tengo cuenta", que solo pide email),
el dato se guarda con `guardarHandoff` y la app navega a `/revisa-tu-mail`.

Ese contrato — qué forma tiene el dato guardado y cómo se arma la URL que
"abre" el mail — vive entero en [`src/lib/handoff.ts`](src/lib/handoff.ts). Es
el punto de integración con el portal: cuando el backend exista, el portal es
quien lee esos mismos parámetros desde `/auth/callback`.

## Datos "a confirmar"

Los datos con `pendiente: true` en `src/mock/planes.ts` se renderizan siempre
con un chip de estado "a confirmar" (nunca se ocultan). Hoy son cuatro:

1. **Óptica** en Nexo I (no listada en el documento de origen, pero sí en
   Nexo II y III, que son más baratos — probable omisión).
2. **Médico a domicilio** en Nexo II.
3. El **precio de Árbol de Vida**.
4. El **precio de Seguro de Vida** (el dato de origen traía pegado el
   comentario "chequear lista de precio de vendedores me parece q esta mal").

**Estos cuatro datos bloquean mostrar la maqueta a Javier** hasta que Federico
los confirme (spec §12, `docs/superpowers/specs/2026-09-07-nexo-3.0-maqueta-design.md`).

## Pendientes

- **Task 27 (e2e Playwright) espera al repo del portal — `npm run e2e`
  todavía no corre.** `@playwright/test` ya está instalado y `tsconfig.json`
  referencia un `playwright.config.ts` que todavía no existe: los tests e2e
  necesitan el portal desplegado (o corriendo local) para probar el flujo
  completo de handoff, así que se escriben recién cuando ese repo esté listo.
- Confirmar los cuatro datos "a confirmar" de la sección anterior.
- Definir si el catálogo público separa productos de planes de forma más
  permanente (hoy la pestaña lo deja abierto).
- Definir los campos obligatorios del perfil por producto (hoy todos llevan
  badge "a definir").
- Definir subdominio o carpeta para la sección privada (afecta
  `VITE_PORTAL_URL`).
