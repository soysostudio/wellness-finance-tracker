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
    contentVariables: JSON.stringify({ '1': body }),
  });
}
