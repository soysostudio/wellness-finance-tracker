import { getOpenAIClient } from './client';

/**
 * Downloads an audio file from a Twilio URL (requires Basic Auth)
 * and transcribes it using OpenAI Whisper.
 */
export async function transcribeAudio(mediaUrl: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials for audio download');
  }

  // Twilio media URLs require Basic Auth
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const audioResponse = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
  }

  // Get the audio as a buffer and wrap it as a File for the OpenAI SDK
  const audioBuffer = await audioResponse.arrayBuffer();
  const contentType = audioResponse.headers.get('content-type') ?? 'audio/ogg';
  const ext = contentType.includes('mp4') ? 'mp4'
    : contentType.includes('mpeg') ? 'mp3'
    : contentType.includes('ogg') ? 'ogg'
    : 'ogg';

  const audioFile = new File([audioBuffer], `voice.${ext}`, { type: contentType });

  const openai = getOpenAIClient();
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'es',
    prompt: 'Gastos, ingresos, pesos colombianos, COP, compras, pagos, metas de ahorro',
  });

  return transcription.text.trim();
}
