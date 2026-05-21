import { waitUntil } from '@vercel/functions';
import { validateTwilioSignature } from '@/lib/twilio/validate-webhook';
import { processIncomingMessage } from '@/lib/queue/message-processor';
import type { TwilioWebhookPayload } from '@/types/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/twilio`;

  // Skip validation in development when no auth token is configured
  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(signature, url, rawBody)) {
    return new Response('Forbidden', { status: 403 });
  }

  const params = new URLSearchParams(rawBody);
  const payload: TwilioWebhookPayload = {
    MessageSid: params.get('MessageSid') ?? '',
    From: params.get('From') ?? '',
    To: params.get('To') ?? '',
    Body: params.get('Body') ?? '',
    NumMedia: parseInt(params.get('NumMedia') ?? '0', 10),
    MediaUrl0: params.get('MediaUrl0') ?? undefined,
    MediaContentType0: params.get('MediaContentType0') ?? undefined,
    ProfileName: params.get('ProfileName') ?? undefined,
  };

  // Allow audio messages through even if Body is empty
  const hasAudio = payload.NumMedia > 0 && payload.MediaContentType0?.startsWith('audio');
  if (!payload.From || (!payload.Body && !hasAudio)) {
    return new Response(TWIML_EMPTY, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  waitUntil(processIncomingMessage(payload).catch(console.error));

  return new Response(TWIML_EMPTY, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
