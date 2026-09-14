# Nexo 3.0 — Reglas del repositorio

## Alcance
- Código nuevo desde cero (rama huérfana): NO se importa código de `main` / `staging` (Nexo 2.0 actual).
- SÍ se hereda la identidad visual de Nexo 2.0: paleta, tipografía, radios, contenedores, iconos sobre degradados.
  Acordado con Federico Cuellos (Previnca) el 2026-09-03.
- SÍ se reutilizan los datos de planes (Nexo I / II / III, prestaciones, on demand) tomados de
  `Nexo 2.0 V9/src/app/data/planes.ts` (staging). Se portan como datos, no como componentes.
- Fase actual: maqueta clickeable, solo frontend. Sin backend, sin base de datos, sin auth real.
  Backend, Magic Link, Supabase y MercadoPago los conecta Federico después.
- Portal de administración: POSPUESTO. No diseñar.

## Producto (ver `docs/`)
- Sección pública: Home, Catálogo (productos / planes), Ficha.
- Flujo de alta: CTA "Contratar" → popup usuario base (nombre, apellido, email, teléfono; plan oculto)
  → "Revisá tu mail" → Magic Link → portal privado con resumen → Pagar (MP) → completar perfil Previnca.
- Sección privada, estilo MercadoPago: menú izquierdo simple + área de contenido.
  Opciones: Inicio / Novedades, Planes, Coberturas, Mis contrataciones, Configuración de cuenta.

## Git
- Trabajar SOLO en la rama `nexo-3.0`. Nunca merge desde/hacia `main` o `staging`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). Sin atribución de IA.
- Un commit = una unidad de trabajo revisable.

## Código
- TypeScript estricto, sin `any`. Componentes funcionales, exports nombrados.
- Stack: Vite 7 + React 19 + TypeScript 5.9 + Tailwind CSS v4 (`@tailwindcss/vite`) + Vitest 4
  (Testing Library, jsdom) + Playwright para e2e + React Router 7 + Radix UI + lucide-react.
  Decidido en el scaffold inicial (tarea 1 del plan SDD).
