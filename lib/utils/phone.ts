/**
 * Normalize a Colombian phone number to E.164 format (e.g. "+573001234567").
 *
 * The canonical stored format across the app is whatever Twilio sends as
 * `From` minus the "whatsapp:" prefix — i.e. E.164 with no spaces. Every place
 * that reads or writes `users.phone_number` must go through this so the web
 * forms and the WhatsApp webhook agree on the same string.
 *
 * Examples:
 *   "300 123 4567"      -> "+573001234567"
 *   "+57 300 123 4567"  -> "+573001234567"
 *   "573001234567"      -> "+573001234567"
 *   "+13055551234"      -> "+13055551234"  (already has country code)
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return `+${digits}`;
  // Bare Colombian mobile (10 digits starting with 3) → prepend +57
  if (digits.startsWith("3") && digits.length === 10) return `+57${digits}`;
  return `+${digits}`;
}
