import { createHmac, timingSafeEqual } from "crypto";

export function verifyTwilioSignature(
  authToken: string,
  signatureHeader: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signatureHeader) return false;

  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(data).digest("base64");

  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

export function parseTwilioSms(params: Record<string, string>) {
  const from = params.From;
  const body = params.Body;
  const messageId = params.MessageSid ?? params.SmsSid;

  if (!from || !body || !messageId) return null;

  return {
    messageId,
    phone: from,
    content: body,
  };
}
