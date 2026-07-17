import { getTwilioClient } from './client';

// Plantilla genérica en revisión de Meta: "🔔 Mensaje de Luca:\n\n{{1}}\n\n💬 Escríbeme si necesitas algo más."
// (v1 sin el cierre fijo fue rechazada: WhatsApp no permite que una plantilla
// termine en una variable). Usar para cualquier mensaje que Luca inicia sin
// que el usuario le haya escrito antes (recordatorios, invitaciones) —
// WhatsApp exige plantilla fuera de la ventana de 24h desde el último
// mensaje del usuario (error 63016 si se manda texto libre).
const GENERIC_TEMPLATE_SID = process.env.TWILIO_GENERIC_TEMPLATE_SID ?? 'HX9ea0c190a4ffb28067ed05d3f7259753';

/** Respuesta dentro de una conversación activa (el usuario le escribió a Luca recientemente). */
export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const client = getTwilioClient();

  const fromNumber = process.env.TWILIO_WHATSAPP_FROM!;
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await client.messages.create({
    from: fromNumber,
    to: toNumber,
    body,
  });
}

/**
 * WhatsApp rechaza variables de plantilla que contengan saltos de línea, tabs
 * o 4+ espacios seguidos (Twilio error 21656) — por eso los resúmenes
 * multilínea del cron fallaban todas las noches. Se aplana a una sola línea:
 * párrafos (\n\n) → " — ", saltos simples → espacio.
 */
function toTemplateVariable(body: string): string {
  const flat = body
    .replace(/\s*\n{2,}\s*/g, ' — ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
  // La plantilla completa (encabezado + variable + cierre) no puede pasar de
  // 1024 caracteres — margen para el texto fijo de la plantilla.
  return flat.length > 950 ? `${flat.slice(0, 949)}…` : flat;
}

/**
 * Mensaje iniciado por Luca sin conversación activa reciente (recordatorios,
 * invitaciones a grupo). Usa la plantilla genérica aprobada por Meta —
 * enviar texto libre aquí falla con el error 63016 de WhatsApp.
 */
export async function sendWhatsAppProactive(to: string, body: string): Promise<void> {
  const client = getTwilioClient();

  const fromNumber = process.env.TWILIO_WHATSAPP_FROM!;
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await client.messages.create({
    from: fromNumber,
    to: toNumber,
    contentSid: GENERIC_TEMPLATE_SID,
    contentVariables: JSON.stringify({ '1': toTemplateVariable(body) }),
  });
}
