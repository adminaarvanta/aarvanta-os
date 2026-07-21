import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LEN = 64;

/** Hash a password with a random salt (scrypt). */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return { hash, salt };
}

/** Verify password against stored hash + salt. */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  try {
    const derived = scryptSync(password, salt, KEY_LEN);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
