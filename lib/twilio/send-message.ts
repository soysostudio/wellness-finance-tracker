import { getTwilioClient } from './client';

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
