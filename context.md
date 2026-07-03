# Contexto de trabajo — Luca

Resumen de todo lo que se hizo sobre **Luca** (asistente de finanzas por WhatsApp para Colombia: Next.js + Supabase + Twilio + OpenAI en Vercel).

---

# Sesión — 30 de junio, 2026

El trabajo se hizo en este orden: **primero los bugs, luego diseño** (decisión de Sofia).

---

## 1. Bugs reportados — arreglados

Los cuatro bugs que Sofia reportó al inicio, más uno extra encontrado:

| Bug | Causa raíz | Arreglo |
|-----|-----------|---------|
| **Creación de presupuestos fallaba** | La tabla `budgets` exige `period_start`/`period_end` (NOT NULL) pero el insert nunca los enviaba | `getPeriodDates()` en `app/api/budgets/route.ts` calcula el rango según el periodo |
| **Recordatorios diarios no funcionaban** | El cron calculaba "hoy" en UTC crudo; dispara a las 01:00 UTC = 8pm Bogotá, así que el día salía corrido | `buildDailySummary()` usa límites de día en hora Bogotá (UTC-5); ahora también manda mensaje si no hubo gastos |
| **Recordatorios semanales** | El CHECK constraint de `reminders` no incluía `weekly_summary` → insert fallaba silenciosamente | Migración `013_fix_reminders_check.sql` (aplicada en producción) |
| **Correo de confirmación no llegaba** | SMTP de Resend con credenciales viejas | Reconfigurado SMTP de Supabase Auth vía Management API con la API key nueva de Resend. Dominio `finance-tracker.xyz` verificado y enviando. **Nota:** rebotes a Hotmail/Outlook son reputación de dominio nuevo, no es bug |
| **Bonus** | Usuarios nuevos no tenían recordatorio | El callback de auth ahora crea el recordatorio diario automáticamente (idempotente) |

También se paralelizaron queries en `app/(dashboard)/layout.tsx` para mejorar el tiempo de respuesta.

---

## 2. Errores y problemas de UX encontrados en la revisión completa — arreglados

- **Presupuestos duplicados:** no había nada que impidiera crear dos presupuestos para la misma categoría. Ahora la API lo bloquea (409) y el formulario esconde las categorías ya usadas.
- **Teléfono mal guardado (crítico):** editar el número en el perfil lo guardaba sin formato, rompiendo el reconocimiento en WhatsApp; y agregar miembros a un grupo fallaba con números con espacios. Se creó `lib/utils/phone.ts` → `normalizePhone()` (formato E.164, ej. `+573001234567`) y se aplicó en perfil, grupos y signup.
- **Tasa de ahorro injusta (Insights):** ignoraba el salario configurado. Ahora suma salario + ingresos registrados, consistente con el Overview.
- **Meta superada:** "Falta" mostraba valor negativo; ahora dice "¡Listo! 🎉".
- **Toggles de recordatorios lentos:** ahora son optimistas (se mueven al instante) con reversión si falla.
- **Filtro de transacciones incompleto:** solo filtraba las 50 cargadas en cliente. Ahora consulta al servidor (`type` + `category`) y "Cargar más" funciona con filtros activos.
- **Colisión de slugs de categoría:** una categoría personal con el mismo nombre que una del sistema rompía la creación de transacciones/presupuestos (`.single()` con 2 filas). Se creó `resolveCategoryId()` (prefiere la categoría propia) y guarda en el form contra nombres duplicados.
- **Confirmaciones en Grupos:** se reemplazaron los `confirm()`/`alert()` nativos por confirmación en línea (estilo del resto del app).
- **Selector de moneda engañoso:** no afectaba el formato (todo es COP). Se fijó en "Pesos colombianos (COP)" con nota "Pronto: más monedas". Multi-moneda real queda como feature futura (requiere pasar la moneda por todo el app + el parser de WhatsApp asume pesos).

---

## 3. Rediseño "El Recibo" (usando la skill frontend-design)

**Insight clave de la skill:** el look original de Luca (fondo crema `#F7F4ED` + titulares serif Playfair + acento terracota) era literalmente el "default #1" de diseño generado por IA.

**Dirección nueva — recibo / cinta de registradora térmica:**
- **Color:** papel térmico frío `#F4F4EF` + tinta con matiz frío `#1A1D1C`. El amarillo Luca `#FEFF6E` como único acento (tipo resaltador). Rojo de sello `#D64550` para alertas/negativos.
- **Tipografía:** titulares en **Space Mono** (`--font-display`) en toda la app — el app "habla" en lenguaje de recibo. Se retiró Playfair. Cuerpo: Plus Jakarta. Montos: Geist Mono tabular (`.font-amount`).
- **Firma (toda la audacia en un lugar):** el resumen del mes en Overview es un recibo de verdad — encabezado "LUCA", reglas dot-matrix punteadas, doble raya sobre el TOTAL, pie "★ Gracias por cuidar tu plata ★", borde perforado, resaltador amarillo sobre el balance, y animación de "impresión" al cargar (respeta reduced-motion).
- Estilos del recibo en `app/globals.css`: `.receipt-rule`, `.receipt-total`, `.receipt-mark`, `.receipt-torn`, `.receipt-print`, `.leader-row`/`.leader-fill`, `.font-amount`.

**Proceso:** se construyó un preview aislado (`/preview`, ya borrado) sin login para tomar screenshots y autocriticar antes de aplicar — porque el flujo de auth es solo magic-link y complica verificar.

---

## 4. Colores de categorías → pastel

A pedido de Sofia (los colores eran invasivos y difíciles de leer):
- **11 tonos distintos** y medio-apagados (antes solo 5 colores repetidos): coral, ámbar, teal, periwinkle, oliva, ciruela, rosa, azul cielo, terracota, verde (ingresos), gris (otros). En `lib/utils/categories.ts`.
- Las tarjetas usan **tinte pastel** vía `tintFromColor()` / `getCategoryTint()` (`color-mix` con blanco al 16%) en vez de fondo saturado. Ícono a color pleno, texto en tinta oscura, borde sutil del mismo tono.
- Para ajustar la intensidad de TODOS los pasteles: cambiar el `16` por defecto en `tintFromColor()`.

---

## Notas técnicas / credenciales (30 jun)

- Proyecto Supabase: `gjpfnqkgthkcgprdqffv` ("Wellness-Finance-Tracker").
- El número de teléfono canónico se guarda en E.164 (`+57...`), igual que lo manda Twilio (`From` sin `whatsapp:`). Todo lo que lea/escriba `users.phone_number` debe pasar por `normalizePhone()`.
- Durante pruebas se amplió temporalmente el `uri_allow_list` de Supabase para incluir `localhost` y **ya se revirtió** a producción.
- Las credenciales (token de Supabase Management, API key de Resend) se usaron de forma transitoria; **no** están guardadas en el repo.
- El servidor headless de Chrome tiene un ancho mínimo de ventana (~500px) — screenshots más angostos recortan la imagen y dan falsa impresión de overflow. No es bug real.

## Estado (30 jun)

Todo commiteado y desplegado en `main` → Vercel (`finance-tracker.xyz`). Build limpio en cada paso.

## Posibles siguientes pasos (30 jun, ya resueltos algunos abajo)

- ~~Wordmark "Luca" del menú/login sigue en fuente de cuerpo (no mono)~~ — sin resolver aún, sigue pendiente.
- Multi-moneda real (feature, no bug) — sigue pendiente.
- Calmar las 3 tarjetas de color sólido en la landing ("cómo funciona") — sigue pendiente.

---

# Sesión — 2 de julio, 2026

Dos bloques de trabajo: (1) diagnóstico + plan de mejoras de funcionalidad/UX aprobado por Sofia, ejecutado en 6 fases; (2) revisión de código con **Fable 5** y corrección de todos sus hallazgos, ejecutado en 7 tandas.

## Bloque 1 — Plan de UX/funcionalidad (6 fases)

Pedido de Sofia: loaders para que no parezca que la app no responde, recordatorios personalizables (no solo el de 8pm), deep-dive en Metas, simplificar la UI (muchos botones), revisar dark mode, y arreglar el contraste/peso de las tarjetas de categoría + accesibilidad.

- **Fase 0 — Loaders:** `app/(dashboard)/loading.tsx` (skeleton automático de Next al navegar), `components/dashboard/nav-pending.tsx` (spinner con `useLinkStatus` en el sidebar), skeleton en `transaction-filter-list.tsx` mientras refetch.
- **Fase 1 — Menos botones:** `components/ui/row-actions.tsx`, un menú "⋯" (editar/eliminar con confirmación) reemplaza los dos botones sueltos en filas de transacciones/presupuestos/metas.
- **Fase 2 — Dark mode + botón de tema:** `components/dashboard/theme-toggle.tsx` (claro/oscuro/sistema, usa `next-themes` que ya estaba instalado pero sin UI). Arreglado `tintFromColor()` para que el tinte pastel de categorías use `var(--tint-base)` (blanco en claro, `#252420` en oscuro) en vez de blanco fijo — antes las tarjetas salían casi blancas en oscuro.
- **Fase 3 — Accesibilidad + tarjetas:** `aria-label` en botones de solo-ícono, `role="switch"`/`aria-checked` en toggles, etiquetas de categoría subidas de `text-foreground/45` (10px, normal) a `/70` (11px, `font-medium`) — Sofia había señalado que se veían muy claras y livianas.
- **Fase 4 — Metas con profundidad:** nueva tabla `goal_contributions` (migración 014), página `app/(dashboard)/goals/[id]/page.tsx` con progreso, proyección ("cuánto ahorrar por mes para llegar a la fecha meta") e historial de aportes/retiros vía `components/dashboard/goal-contribution-form.tsx`.
- **Fase 5 — Recordatorios personalizados:** columnas nuevas en `reminders` (migración 015: `title`, `frequency`, `day_of_month`, `day_of_week`, `run_date`). UI en Ajustes (`components/dashboard/custom-reminders.tsx`) para crear recordatorios tipo "pagar el arriendo" con recurrencia mensual/semanal/una vez. **Decisión importante:** Sofia sigue en el plan gratuito de Vercel, que solo permite cron 1x/día — así que todos los recordatorios personalizados se entregan en el slot fijo de las 8pm (no a la hora exacta que elija el usuario). Si algún día pasa a Vercel Pro, se puede subir a hora exacta con un cambio pequeño (`hour_local` ya existe en el esquema).

También en esta sesión: rediseño de colores de categoría a pastel real (11 tonos únicos, `getCategoryTint`) — esto ya estaba iniciado el 30 jun y se refinó aquí.

## Bloque 2 — Revisión con Fable 5 + fix de todos los hallazgos (7 tandas)

A pedido de Sofia se corrió una revisión de código completa usando el modelo **Fable 5** (agente de solo lectura, sin editar nada). Encontró 1 bug crítico de seguridad, varios de correctitud, y temas de accesibilidad/UX. Sofia pidió "haz un plan y ajusta todo" → se ejecutaron las 7 tandas siguientes:

- **Tanda A — Zona horaria:** `lib/utils/dates.ts` calculaba límites de mes/semana en medianoche **UTC** del día-calendario Bogotá, no medianoche Bogotá real (05:00Z). Un gasto entre 7pm y medianoche del último día del mes/semana se contaba en el período siguiente. Se corrigió con `fromZonedTime` de `date-fns-tz`. Se movió `getPeriodDates` de presupuestos a `lib/utils/dates.ts` como `getBudgetPeriodDates()` (mismo problema, mismo fix). Verificado con un script: `2026-07-01T05:00:00.000Z` es ahora el inicio correcto de julio en Bogotá.
- **Tanda B — Correctitud de APIs:** editar-transacción todavía tenía el bug de colisión de slug de categoría que `resolveCategoryId()` (del 30 jun) no había cubierto — se aplicó ahí también. Editar-presupuesto ahora recalcula `period_start/period_end` si cambia el período. Validación de `amount`/`offset`/`limit` en las rutas de transacciones.
- **Tanda C — Ledger de metas atómico:** el aporte/retiro de metas (Fase 4 de arriba) no era atómico y un retiro mayor al saldo desincronizaba el historial del saldo real. Se creó una función RPC de Postgres `apply_goal_contribution` (migración 016, `SECURITY INVOKER`, bloquea la fila con `FOR UPDATE`, rechaza retiros que dejen saldo negativo) y se llama vía `supabase.rpc(...)` desde `app/api/goals/[id]/contributions/route.ts`. El PATCH de metas ya no acepta `current_amount` directo (el saldo solo cambia por aportes).
- **Tanda D — Recordatorios robustos:** índice único parcial `(user_id, reminder_type)` para daily/weekly (migración 017) + toggle idempotente por upsert (antes un caso de carrera podía dejar "apagado en la UI pero activo en la base"). El cron ahora acepta ventana 01–02 UTC (antes solo exactamente la 1, y en el plan gratuito Vercel puede correr tarde). Recordatorio mensual "día 31" ahora dispara el último día en meses cortos (antes se saltaba febrero/abril/etc). Limpieza automática de recordatorios "una vez" ya vencidos.
- **Tanda E — Seguridad fail-closed:** el webhook de Twilio (`app/api/webhooks/twilio/route.ts`) y el cron de recordatorios ahora **fallan cerrado** (500) si falta `TWILIO_AUTH_TOKEN`/`CRON_SECRET` en vez de saltarse la validación — antes, si esas env vars faltaban en producción por accidente, cualquiera podía forjar mensajes de WhatsApp o disparar el cron.
- **Tanda F — Verificación de teléfono (el hallazgo más grave):** cualquier usuario podía escribir cualquier número en su perfil sin probar que era suyo. Como `phone_number` es único y primero-en-llegar gana, alguien podía "robar" el número de otra persona y empezar a recibir sus gastos de WhatsApp en su propia cuenta de Luca. Fix elegido por Sofia: **verificación por mensaje entrante** (sin plantillas nuevas de Twilio). Flujo: nueva tabla `phone_verifications` (migración 018) → `POST /api/phone/verify/start` genera un código tipo `LUCA-XXXX` (no envía nada saliente) → el usuario debe enviar ese código a Luca por WhatsApp **desde el número que quiere vincular** → `lib/queue/message-processor.ts` detecta el patrón del código, confirma que coincide con el número remitente, y recién ahí vincula. Se eliminó `components/dashboard/phone-linker.tsx` (escribía el número directo desde el cliente) y se creó `components/dashboard/phone-verify.tsx` en su lugar. También se cerró un "oráculo de teléfonos" en `app/api/groups/[id]/members/route.ts`: antes revelaba si un número estaba registrado en Luca o no; ahora siempre responde genérico.
- **Tanda G — Accesibilidad + pulido menor:** se quitó el `role="menu"`/`role="menuitem"` a medias de `RowActions` (sin navegación por teclado real, mejor ser honesto con botones planos). Los previews de color de categoría (al crear/editar) ahora eligen texto claro u oscuro según la luminancia del color de fondo (`readableTextOn()`) — antes el texto era `#1A1A1A` fijo, ilegible sobre colores oscuros como el azul marino. Modales de edición con `role="dialog"` + `aria-modal`. El filtro de transacciones muestra un estado de error real si el fetch falla (antes parecía "sin resultados" silenciosamente). `formatCOPColoquial`: 999.999 ahora dice "1 millón" en vez de "1000 mil pesos".

### Nota sobre el intento de agendar Fable 5 en la nube
Sofia pidió agendar la revisión con Fable 5 para la 1pm (límite de uso del modelo se reinicia a esa hora). Al llegar el momento, ya habían pasado las 1:54pm — el límite ya se había reiniciado, así que se corrió la revisión localmente en vez de agendarla en la nube. Nota para el futuro: agendar corridas en la nube contra este repo requeriría conectar GitHub primero (`/web-setup` o instalar la Claude GitHub App) — hoy no estaba conectado.

## Notas técnicas / credenciales (2 jul)

- Migraciones aplicadas en producción vía Supabase MCP: `014_goal_contributions`, `015_custom_reminders`, `016_goal_apply_contribution`, `017_reminders_unique`, `018_phone_verifications` (todas en el proyecto `gjpfnqkgthkcgprdqffv`).
- `lib/supabase/types.ts` se actualiza a mano (no hay generación automática configurada) cada vez que se agregan tablas/columnas/funciones RPC nuevas — si una migración futura no actualiza este archivo, TypeScript no va a fallar en tiempo de compilación pero Supabase sí puede rechazar columnas en runtime.
- El número de teléfono ahora solo puede escribirse mediante el flujo de verificación (`/api/phone/verify/start` + confirmación por WhatsApp entrante) — cualquier código nuevo que necesite vincular un teléfono debe pasar por ahí, no escribir `users.phone_number` directo desde el cliente.
- El límite de uso del modelo Fable 5 se reinicia a la 1pm hora Bogotá (dato observado, puede cambiar).

## Estado (2 jul)

Los 2 bloques (6 fases + 7 tandas) commiteados y desplegados en `main` → Vercel. `tsc --noEmit` y `next build` limpios en cada tanda/fase. Verificación visual (claro/oscuro) hecha con screenshots de Chrome headless para: tarjetas pastel, recibo con resaltador, recordatorios personalizados, formulario de aportes, y el nuevo flujo de verificación de teléfono.

**Pendiente de probar en vivo** (no se pudo automatizar sin enviar WhatsApps reales): el flujo completo de verificación de teléfono por mensaje entrante — Sofia debería probarlo manualmente una vez desplegado, enviando el código real a Luca desde el número que quiere vincular.

## Posibles siguientes pasos (2 jul)

- Probar en producción el flujo de verificación de teléfono end-to-end.
- Si Sofia pasa a Vercel Pro: subir los recordatorios personalizados de "8pm fijo" a hora exacta (`hour_local` ya existe en el esquema, falta el cron horario).
- Conectar GitHub al repo si se quiere usar revisiones/agentes programados en la nube.

---

## Bloque 3 — Pantalla en blanco + Luca sin responder por WhatsApp (2 jul, continuación)

Sofia reportó dos problemas nuevos al probar lo desplegado: (1) pantalla en blanco al entrar a Overview, (2) Luca registra el gasto en la base de datos pero no contesta con el "¡Registrado!" por WhatsApp.

### Pantalla en blanco al navegar — arreglado ✅
**Causa:** `app/(dashboard)/layout.tsx` hacía hasta 3 consultas seguidas (perfil, presupuestos, y una tercera para la alerta de presupuesto) **antes** de renderizar cualquier página. Next.js NO cubre el layout con el `loading.tsx` del mismo segmento (solo cubre `page.tsx`) — así que todo ese trabajo bloqueaba sin mostrar ningún esqueleto, más notorio en Overview por ser la pantalla de aterrizaje tras login.

**Arreglo:**
- El layout ahora solo espera `auth.getUser()` (lo mínimo indispensable).
- El nombre en el sidebar/menú móvil sale de `user.user_metadata.full_name` (viene gratis con `getUser()`, sin consulta extra a la tabla `users`).
- La alerta de presupuesto (el puntito naranja en "Presupuestos") se resuelve del lado del cliente: nuevo `GET /api/budgets/alert-status` + hook `lib/hooks/use-budget-alert.ts`, usado internamente por `SidebarNav` y `MobileNav` (ya no reciben `budgetAlert` como prop). Aparece un instante después de cargar la página, nunca bloquea la navegación.
- `components/dashboard/profile-form.tsx` ahora también actualiza `auth.updateUser({ data: { full_name } })` al guardar el perfil (además de la tabla `users`), para que el nombre mostrado en el sidebar no se quede desactualizado tras editarlo en Ajustes.

### Luca no responde por WhatsApp — diagnosticado y arreglado (pendiente aprobación de Meta) 🟡
Se investigó directo en la API de Twilio (con las credenciales de `.env.local`) en vez de adivinar.

**Primer diagnóstico (parcialmente corregido después):** al ver los primeros ~15 mensajes salientes, todos fallaban con error **63112** ("Meta desactivó la cuenta de WhatsApp Business"). Al ampliar la muestra a 100 mensajes, la foto cambió: 37 entregados, 7 leídos, solo 9 con 63112 (mezclados en el tiempo con entregas exitosas — no es un corte definitivo) y **5 con error 63016** ("Outside messaging window — usa un Message Template"). Se confirmó vía `GET /v2/Channels/Senders` que el número de producción (`+15559613540`, "Luca Finance") está **ONLINE con calidad HIGH** — la cuenta está sana. El 63112 parece intermitente/menor, no una desactivación real; el 63016 es el problema real y sistemático.

**Causa raíz real (63016):** WhatsApp Business exige que cualquier mensaje que Luca *inicia* (no como respuesta a algo que el usuario le escribió en las últimas 24h) use una plantilla pre-aprobada por Meta. Los 5 mensajes que fallaron eran exactamente los resúmenes automáticos del cron (`buildDailySummary`/`buildWeeklySummary`). Se confirmó que la cuenta **no tenía ninguna plantilla aprobada** (las 5 que existían en Twilio Content API eran las de ejemplo por defecto, nunca sometidas a revisión).

**Arreglo (con aprobación explícita de Sofia antes de tocar Twilio/Meta):**
- Se creó una plantilla genérica de WhatsApp vía Twilio Content API: `"🔔 Mensaje de Luca:\n\n{{1}}\n\n💬 Escríbeme si necesitas algo más."` — una sola plantilla flexible que sirve para recordatorios, invitaciones, etc. sin necesitar una por tipo de mensaje.
  - **v1** (`HXae660455e903b7e12b1934d18b5db863`, sin el cierre fijo) fue **rechazada por Meta**: "Variables can't be at the start or end of the template" — la plantilla terminaba justo en `{{1}}`.
  - **v2** (`HX9ea0c190a4ffb28067ed05d3f7259753`, con el cierre "💬 Escríbeme...") se envió a revisión — **estado pendiente** al cerrar la sesión. Verificar en Twilio Console o pedirme que consulte de nuevo el estado.
- Código: nueva función `sendWhatsAppProactive()` en `lib/twilio/send-message.ts` que envía por Content API (`contentSid` + `contentVariables`) en vez de texto libre. Se migraron a esta función los únicos puntos que son verdaderamente proactivos (no respuestas dentro de sesión):
  - El cron de recordatorios (`app/api/cron/reminders/route.ts`) — daily/weekly/custom.
  - Las 2 invitaciones a grupo por WhatsApp en `lib/queue/message-processor.ts` (miembro ya registrado / miembro nuevo).
  - La invitación a grupo disparada desde la web en `app/api/groups/[id]/members/route.ts`.
  - Se revisó CADA llamada restante a `sendWhatsAppMessage` en el proyecto: todas las demás responden a `payload.From` (quien acaba de escribirle a Luca, dentro de la ventana de 24h) — incluida la alerta de presupuesto (`checkBudgetAlert`), que se dispara sincrónicamente justo después del mensaje del usuario. Esas correctamente se quedan con texto libre.

**Pendiente:** confirmar que Meta aprobó la plantilla v2 (puede tardar de minutos a ~24-48h) — sin eso, los recordatorios e invitaciones seguirán fallando. Una vez aprobada, no hace falta ningún cambio de código adicional: `sendWhatsAppProactive()` ya apunta al SID correcto.

### Notas técnicas nuevas (2 jul, bloque 3)
- Credenciales de Twilio disponibles en `.env.local` (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`) — útiles para diagnosticar directo contra la API REST de Twilio (`Messages.json`, `Content API`, `Messaging Senders API`) en vez de adivinar por los logs de la app.
- El `TWILIO_WHATSAPP_FROM` de `.env.local` (`+14155238886`, sandbox) **no coincide** con el número real de producción (`+15559613540`, "Luca Finance") — Vercel tiene su propia env var distinta. Tenerlo en cuenta si se vuelve a diagnosticar algo de Twilio localmente: usar el Account SID para consultar todos los mensajes de la cuenta, no filtrar por el `From` local.
- El SID de la plantilla activa vive con un valor por defecto hardcodeado en `lib/twilio/send-message.ts` (`GENERIC_TEMPLATE_SID`), pero se puede sobreescribir con la env var `TWILIO_GENERIC_TEMPLATE_SID` si se necesita cambiarla sin tocar código.

## Estado (2 jul, bloque 3)

Código desplegado en `main` → Vercel. `tsc`/`next build` limpios. **Bloqueante externo:** los recordatorios y invitaciones seguirán sin llegar hasta que Meta apruebe la plantilla v2 — no es algo que se resuelva con más código, hay que esperar/revisar el estado en Twilio.

## Posibles siguientes pasos (2 jul, bloque 3)

- Revisar si Meta ya aprobó `HX9ea0c190a4ffb28067ed05d3f7259753` (consultar `GET /v1/Content/{sid}/ApprovalRequests` o la consola de Twilio) y probar un recordatorio real una vez aprobada.
- Si Meta rechaza la v2 por otro motivo, ajustar el texto y volver a someter (cada intento requiere crear un Content nuevo — no se puede editar uno ya creado).
- Investigar el origen puntual de las fallas 63112 (minoritarias) si vuelven a aparecer con frecuencia — abrir ticket a soporte de Twilio con los SIDs específicos si persiste.
