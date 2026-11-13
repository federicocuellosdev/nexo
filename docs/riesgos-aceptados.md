# Riesgos operativos aceptados — Nexo v3

Este archivo documenta decisiones operativas que a primera vista parecen bugs
pero están aceptadas por el negocio o son limitaciones del stack externo.
Se mantienen acá para que futuros desarrolladores (o Claude Code) no las
reporten como issues a resolver.

## 1. Pagos reales durante staging/testing

**Qué pasa**: el `MP_ACCESS_TOKEN` configurado en Vercel (`nexo-back`) es de tipo
`TEST-...` pero conectado al collector real de Previnca. Cuando un payer paga
con una **cuenta MP real**, MP procesa el cobro como transacción real y debita
$15.000 ARS de verdad, aunque el token sea "test".

**Por qué se deja así**: el **webhook de MP no funciona en modo sandbox puro**
(MP no entrega notificaciones a URLs del webhook cuando el flujo entero está en
test). Para poder validar end-to-end el sale_intake contra SF y el hidratado
del portal, necesitamos que el webhook llegue, y para eso necesitamos
transacciones reales.

**Operativa**: en cada prueba de alta end-to-end se refundea manualmente el
pago con `POST /v1/payments/{id}/refunds` usando el token prod
(`APP_USR-...` descifrado de `c:/Dev/break/nexo/.mp.json` vía SOPS).
No se ejecuta migración a production MP token hasta el lanzamiento.

## 2. Webhook de MP: producción como proxy hacia staging

**Qué pasa**: en el dashboard de MercadoPago, el webhook de preapproval/payment
está configurado apuntando a **la URL del back de producción**, no al de
staging. La instancia de producción recibe la notificación de MP y
**la reenvía como proxy** al back de staging (`nexo-back-one.vercel.app`).

**Por qué se deja así**: MP permite configurar una sola URL de webhook por
aplicación. Cambiar la URL para apuntar a staging rompería producción.
Mantener el proxy desde el back de prod es la forma sostenible de tener los
dos ambientes recibiendo notificaciones sin reconfigurar MP en cada deploy.

**Operativa**: no hay nada que hacer. Si en algún futuro el webhook deja de
llegar a staging, revisar que la instancia de producción esté levantada y
que el código del proxy siga vigente.

## 6. Records de Salesforce (Lead/Account/Order) no se pueden borrar

**Qué pasa**: cuando se corre un alta de prueba end-to-end, se crean registros
reales en el org de SF de Previnca (Lead, Account, Order). Los contratos
que Previnca firmó con Nespon (los 4 YAMLs: Lead-Intake, Sale-Intake,
Additional-Sale, Copayment) **no exponen endpoints de delete/cancel/void**.
Solo tienen operaciones de creación.

**Por qué se deja así**: no tenemos forma programática de limpiar los records
desde el código. Ampliar el contrato con Nespon para agregar un endpoint de
cancelación es una gestión comercial pendiente que escapa al alcance del
sprint.

**Operativa**: los records de prueba quedan en el org de SF productivo.
Si molestan, se eliminan manualmente desde el admin de Salesforce de
Previnca (buscar por `sf_lead_id` o `sf_account_id` que figuran en
`v3.leads`). No hay acción posible del lado del back.

---

Última actualización: 2026-11-12
