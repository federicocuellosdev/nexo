# Landing Nexo 3.0 — rediseño editorial

Fecha: 2026-09-08
Referencia visual: https://almaheartwell.framer.website/
Estado: aprobado, en implementación

## 1. Qué se pidió

Acercar la landing al lenguaje de Alma Heartwell manteniendo la identidad de
Previnca, agregar el motion que hoy no existe y subir la calidad de
construcción. Alcance: las 6 pantallas públicas, no solo `Home`.

## 2. Diagnóstico medido

Medición hecha con Playwright sobre la landing en `localhost:5173` y sobre la
referencia.

| | Alma Heartwell | Nexo (antes) |
|---|---|---|
| Alto de página | 12.022 px | 4.329 px |
| Headline máximo | 96 px (display 206 px) | 52 px |
| Tracking en display | −0,04 em | −0,01 em fijo |
| Hero | 100 vh a sangre | 640 px fijos |
| Reveals por scroll | sí | 0 |
| Elementos con transición | decenas | 28, todos hover |

El techo de la escala tipográfica (`--text-3xl: 2.5rem`) es el gap estructural
más grande: ningún recurso de layout compensa un headline que no puede crecer.

## 3. Decisión de dirección

**Se transpone la gramática, no la paleta.**

Lo que hace premium a Alma no es el crema/terracota: es el ritmo, la escala
tipográfica, la composición editorial y el motion. Todo eso es independiente
del color y convive con el violeta `#8660ef` de Previnca.

Descartado: recolorear a crema/terracota (mata la identidad).
Descartado: instalar Framer Motion o GSAP (rompe la convención documentada en
el commit `3ae939b`, "sin librerías de animación ni scroll-jacking").

## 4. Tipografía

Se **agrega** escala display por encima de la existente; no se toca ningún paso
actual (`--text-xs` … `--text-3xl` quedan idénticos, y `tokens.test.ts` los
exige).

```
--text-4xl: clamp(2.5rem, 4vw + 1rem, 3.5rem)   /* 40→56  lh 1.05 */
--text-5xl: clamp(3rem,   6vw + 1rem, 4.5rem)   /* 48→72  lh 1.00 */
--text-6xl: clamp(3.5rem, 8vw + 1rem, 6rem)     /* 56→96  lh 0.95 */
```

El `letter-spacing: -0.01em` fijo de `global.css` se reemplaza por tracking
proporcional al tamaño: −0,02 em en `4xl`, −0,03 em en `5xl`, −0,04 em en `6xl`.
A 96 px, −0,01 em se lee como tipografía suelta.

## 5. Ritmo vertical

`py-16 lg:py-24` (64/96 px) pasa a `py-24 lg:py-40` (96/160 px).
Hero a `min-h-[100svh]` — `svh` y no `vh`, para que el chrome del navegador
móvil no recorte el contenido.

## 6. Sistema de motion

Gate aplicado (skill `animate`): la landing es superficie de tier
"ocasional / primera vez", que es donde vive el presupuesto de delight.

| Movimiento | Propósito | Herramienta | Propiedades | Curva | Duración |
|---|---|---|---|---|---|
| Entrada del hero | explicación | CSS animation + delays | `translateY(20px)`, `opacity` | `--ease-out-expo` | 700 ms · stagger 80 ms |
| Reveal por scroll | explicación | `animation-timeline: view()` + fallback IO | `translateY(24px)`, `opacity` | `--ease-out-expo` | 600 ms · stagger 60 ms |
| Parallax del hero | consistencia espacial | `animation-timeline: scroll()` | `translateY` 0→8 % | `linear` | ligada al scroll |
| Header al scrollear | indicación de estado | sentinel + IO | `background`, `backdrop-filter` | `ease` | 200 ms |
| Hover de cards | feedback | `transition` gateada | `translateY(-2px)`, `shadow` | `--ease-out-quart` | 200 ms |
| Cambio de ruta | consistencia espacial | View Transitions API | crossfade de opacidad | `--ease-out-quart` | 250 ms |

Sólo se animan `transform` y `opacity`.

**Rechazado explícitamente**: contador animado en los precios (mueve un dato que
el usuario tiene que leer), scroll-jacking, cursor personalizado.

### 6.1 Las dos trampas de construcción

Ambas producen una página en blanco si se resuelven mal.

1. `global.css:46` fuerza `animation-duration: 0.01ms !important` bajo
   `prefers-reduced-motion`. Si el estado inicial `opacity: 0` viviera en la
   clase base, quien tenga movimiento reducido no vería nada. **El estado oculto
   va dentro de `@media (prefers-reduced-motion: no-preference)`.**
2. Mismo riesgo si falla el JS del `IntersectionObserver`. **El ocultamiento se
   activa desde JS** (clase en `<html>`), nunca desde el CSS base. Sin JS, todo
   se ve.

## 7. Fotografía

Banco tomado del sitio productivo (`nexo.previncasalud.com.ar`): 12 imágenes,
contra las 3 que había en el repo.

8 de las 12 traían duotono violeta. No es un error suelto: es el estilo de casa
del sitio actual. En muchas el violeta está **en la escena** (la ropa es
violeta, la pared es violeta, los jacarandás son violetas), así que no se puede
"sacar" — sólo se puede neutralizar el sesgo del grading.

Receta aplicada, verificada sobre crops de caras:

```
magick origen.webp -channel G -gamma 1.18 +channel -modulate 102,88 \
  -fill "#ffd9a8" -colorize 6 -sigmoidal-contrast 2,45% -quality 82 salida.webp
```

Resultado: pieles naturales, pelo castaño correcto, ropa violeta preservada.
La marca sobrevive; el filtro barato no.

Descartado `-channel G -gamma 1.35`: en miniatura parece mejor, pero al mirar
crops de caras el pelo oscuro se vuelve verde oliva.

**Limitación asumida**: el banco tope es 1672×941. En un hero full-viewport a 2×
de densidad va a quedar algo blando. Se mitiga con encuadre agresivo y grano
sutil; no desaparece.

## 8. Qué no se toca

- Tokens de color (`marca`, `acento`, `durazno`, `ink-*`, semánticos) y
  `--color-app: #f6f5fb` — hay tests que fijan sus valores exactos.
- Primitivos de `src/ui/` — ~11 archivos de test assertan sus clases.
- Roles, `aria-label`, textos de botones y jerarquía `h1→h2→h3`.
- El tiering de `prefers-reduced-motion` de `global.css`, que ya está bien
  resuelto.

Criterio de aceptación: **los 213 tests siguen verdes sin editarlos.**

## 9. Orden de implementación

1. Fotografía corregida e importada — hecho
2. `tokens.css`: escala display + tracking proporcional
3. `motion.css` + primitiva de reveal (con las dos salvaguardas de §6.1)
4. `Home.tsx` como implementación de referencia
5. Propagación a `Catalogo`, `FichaPlan`, `FichaProducto`, `AltaDialog`,
   `RevisaTuMail`
6. Verificación: `npm test`, `tsc --noEmit` y capturas con Playwright en
   desktop y mobile
