# Nexo 3.0 — Contexto de producto

Fuente: reunión Matias Yennerich + Federico Cuellos (Previnca), 2026-09-03, más
diagrama de Miro (`flujo-miro.png`) y esquema de datos de Previnca en Notion.

## Qué es
Nueva experiencia de Nexo (Previnca Salud) como **aplicación web con usuarios**, no
solo un onboarding para contratar un plan. Referencia de UX: **MercadoPago** — menú
lateral simple, área de contenido que cambia, secciones por producto.

## Alcance de esta fase (frontend)
Maqueta clickeable, "como si estuviera funcional". Sin backend, BD, auth ni pagos
reales: eso lo conecta Federico después (Magic Link, Supabase, MercadoPago, Salesforce).
El portal de administración está POSPUESTO hasta consolidar el modelo de negocio.

## Estructura

### Sección pública (catálogo, sin cuenta)
- **Home**
- **Catálogo**: productos y planes. Puede ser un catálogo o dos (productos+coberturas
  / planes); no está definido.
- **Ficha** de producto o plan, con CTA "Contratar".

### Flujo de alta (nuevo)
1. CTA "Contratar" → **popup** de creación de usuario base: nombre, apellido, email,
   teléfono. El plan/cobertura elegido viaja como **campo oculto**.
   Si el usuario ya existe → login solo con email.
2. Mensaje **"Revisá tu mail"**. Llega un **Magic Link** (token, sin contraseña).
3. El link lo deja en el **portal privado**, con bienvenida y **resumen** de lo que
   está contratando: plan, cobertura, precio.
4. **Pagar** → redirección a MercadoPago → vuelve.
5. "Gracias por tu pago. Para finalizar el alta completá tu perfil" → formulario
   extendido de Previnca (ver abajo). Se pide DESPUÉS del pago para reducir abandono.
6. Futuras contrataciones: el perfil ya está completo; solo se piden datos del
   producto nuevo (ej. dirección para Seguro de Hogar).

### Sección privada (estilo MercadoPago)
Menú izquierdo: logo + cinco opciones. Contenido a la derecha.
- **Inicio / Novedades**: saludo, banner de novedades (a futuro, personalizable por perfil).
- **Planes**: planes disponibles para contratar.
- **Coberturas**: lo que el usuario tiene contratado.
- **Mis contrataciones**: historial / transacciones.
- **Configuración de cuenta**.

## Datos

### Usuario base (paso 1)
nombre · apellido · email · teléfono · plan/cobertura solicitada (oculto)

### Perfil Previnca (paso 5) — esquema validado por Previnca
| Campo | Tipo |
|---|---|
| Apellido | caracter |
| Nombre | caracter |
| Tipo de documento | caracter |
| Número de documento | numérico |
| Fecha de nacimiento | fecha |
| Edad | numérico |
| Sexo | caracter |
| Celular | numérico |
| Email | caracter |
| Obra social / Prepaga | caracter (¿tiene? sí/no + detalle) |
| Domicilio | objeto / entidad |
| Tipo de contacto | — |
| Beneficiario de seguro | caracter |
| Tipo de contratación | Beneficiario / Tomador / Tomador & Beneficiario |

**Requiere más debate** (no cerrar en la maqueta): obligatoriedad de obra social,
fecha de nacimiento y beneficiario según el producto.

### Entidades Salesforce
Lead → Orden → Cliente Previnca (datos + pago efectivo).
Coberturas/productos se importarán desde Salesforce; los planes se construyen a
partir de productos. Integración pendiente.

## Planes (fuente: Nexo 2.0 staging, `referencia/planes.nexo-2.0.ts`)
| Plan | Precio/mes | Bajada |
|---|---|---|
| Nexo I | $20.000 | Cobertura completa: emergencias, odontología y farmacia (recomendado) |
| Nexo II | $12.000 | Seguro de salud, farmacia y óptica, con telemedicina |
| Nexo III | $7.000 | Puerta de entrada: seguro de salud y telemedicina |

Prestaciones con estado `incluido` / `coseguro` / `no-incluido` y flags `pendiente`
(datos no confirmados por el cliente). Servicios on demand: Seguro de Salud I,
Árbol de Vida, Seguro de Hogar (2 variantes), Seguro de Vida.

## Identidad visual heredada (fuente: `referencia/theme.nexo-2.0.css`)
- Tipografía: **DM Sans** (texto) y **DM Serif Display** (títulos), auto-hospedadas.
- Paleta: purple `#8660ef`, pink `#ee5cd0`, peach `#e5ab9f`; variantes light/border al 10 % / 30 %.
- `--gradient-brand`: 135deg purple → pink.
- Radios: 16 px / 10 px / pill. Glass `rgba(255,255,255,.7)`. Sombras suaves en 4 niveles.
- Easings: out-expo, out-quart.
