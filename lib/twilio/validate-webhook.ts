import { createHmac } from 'crypto';

export function validateTwilioSignature(
  signature: string,
  url: string,
  rawBody: string
): boolean {
  const params = new URLSearchParams(rawBody);
  const sortedKeys = [...params.keys()].sort();

  let str = url;
  for (const key of sortedKeys) {
    str += key + (params.get(key) ?? '');
  }

  const expected = createHmac('sha1', process.env.TWILIO_AUTH_TOKEN!)
    .update(str)
    .digest('base64');

  return expected === signature;
}
