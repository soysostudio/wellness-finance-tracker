export interface TwilioWebhookPayload {
  MessageSid: string;
  From: string;       // 'whatsapp:+573001234567'
  To: string;
  Body: string;
  NumMedia: number;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
}
