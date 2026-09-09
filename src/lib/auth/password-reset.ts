import { createHash, randomInt, timingSafeEqual } from "crypto";
import { assertPasswordConfirmation } from "@/lib/account/passwords";
import { isEmailConfigured } from "@/lib/channels/config";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  isMemoryDatastore,
  withFirestoreFallback,
} from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  getUserCredentials,
  upsertUserPassword,
} from "@/lib/auth/user-credentials";
import { sendPasswordResetEmail } from "@/lib/auth/send-password-reset-email";

export const RESET_CODE_TTL_MS = 10 * 60 * 1000;
export const RESET_SEND_COOLDOWN_MS = 60 * 1000;
export const RESET_MAX_SENDS_PER_HOUR = 5;
export const RESET_MAX_VERIFY_ATTEMPTS = 5;

export const RESET_REQUEST_MESSAGE =
  "If an account exists for that email, we sent a verification code.";
export const INVALID_CODE_MESSAGE = "Invalid or expired code.";
export const EMAIL_UNAVAILABLE_MESSAGE =
  "Password reset email is temporarily unavailable. Please try again shortly.";
export const RESET_SUCCESS_NEXT = "/login?reset=success";

const COLLECTION = "password_reset_codes";
const DEMO_PEPPER = "aarvanta-demo-password-reset-pepper";

export type PasswordResetRecord = {
  email: string;
  userId: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  createdAt: string;
  lastSentAt: string;
  sendCountHour: number;
  hourWindowStart: string;
};

export type ResetTarget = {
  userId: string;
};

export type RequestPasswordResetResult =
  | { ok: true }
  | { ok: false; status: number; code: string; message: string };

export type CompletePasswordResetResult =
  | { ok: true; next: string }
  | { ok: false; status: number; code: string; message: string };

export type VerifyResetCodeResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; code: string; message: string };

const memory = new Map<string, PasswordResetRecord>();

export function normalizeResetEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeResetCode(code: string) {
  return code.replace(/\D/g, "");
}

function nowIso(now: number) {
  return new Date(now).toISOString();
}

function getPepper() {
  return process.env.AUTH_SECRET?.trim() || DEMO_PEPPER;
}

function shouldUseResetMemory() {
  return isDemoMode() || !isFirebaseConfigured() || isMemoryDatastore();
}

export function generateResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashResetCode(code: string): string {
  const normalized = normalizeResetCode(code);
  return createHash("sha256")
    .update(`${getPepper()}:${normalized}`)
    .digest("hex");
}

export function resetCodesMatch(code: string, storedHash: string): boolean {
  const hash = hashResetCode(code);
  try {
    const provided = Buffer.from(hash, "hex");
    const expected = Buffer.from(storedHash, "hex");
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

async function readRecord(email: string): Promise<PasswordResetRecord | null> {
  const key = normalizeResetEmail(email);
  if (shouldUseResetMemory()) {
    return memory.get(key) ?? null;
  }

  return withFirestoreFallback(
    async () => {
      const db = getAdminFirestore();
      if (!db) return memory.get(key) ?? null;
      const snap = await db.collection(COLLECTION).doc(key).get();
      if (!snap.exists) return null;
      const record = snap.data() as PasswordResetRecord;
      memory.set(key, record);
      return record;
    },
    () => memory.get(key) ?? null
  );
}

async function writeRecord(
  record: PasswordResetRecord
): Promise<PasswordResetRecord> {
  const key = normalizeResetEmail(record.email);
  memory.set(key, record);
  if (shouldUseResetMemory()) {
    return record;
  }

  return withFirestoreFallback(
    async () => {
      const db = getAdminFirestore();
      if (db) await db.collection(COLLECTION).doc(key).set(record);
      return record;
    },
    () => record
  );
}

async function deleteRecord(email: string): Promise<void> {
  const key = normalizeResetEmail(email);
  memory.delete(key);
  if (shouldUseResetMemory()) return;

  await withFirestoreFallback(
    async () => {
      const db = getAdminFirestore();
      if (db) await db.collection(COLLECTION).doc(key).delete();
    },
    () => undefined
  );
}

export async function getPasswordResetRecord(
  email: string
): Promise<PasswordResetRecord | null> {
  return readRecord(email);
}

export function clearPasswordResetMemoryForTests() {
  memory.clear();
}

export async function expirePasswordResetCodeForTests(email: string) {
  const record = await readRecord(email);
  if (!record) return;
  await writeRecord({
    ...record,
    expiresAt: new Date(0).toISOString(),
  });
}

function hourWindow(record: PasswordResetRecord | null, now: number) {
  if (!record) {
    return { start: nowIso(now), count: 0 };
  }
  const startMs = Date.parse(record.hourWindowStart);
  if (!Number.isFinite(startMs) || now - startMs >= 60 * 60 * 1000) {
    return { start: nowIso(now), count: 0 };
  }
  return { start: record.hourWindowStart, count: record.sendCountHour };
}

function isSendThrottled(record: PasswordResetRecord | null, now: number) {
  if (!record) return false;
  const window = hourWindow(record, now);
  if (window.count >= RESET_MAX_SENDS_PER_HOUR) return true;
  const lastSent = Date.parse(record.lastSentAt);
  if (Number.isFinite(lastSent) && now - lastSent < RESET_SEND_COOLDOWN_MS) {
    return true;
  }
  return false;
}

export async function resolveResetTarget(
  email: string
): Promise<ResetTarget | null> {
  const key = normalizeResetEmail(email);
  if (!key) return null;

  const creds = await getUserCredentials(key);
  if (creds?.userId) return { userId: creds.userId };

  const memberships = await getTenantRepository().listMembershipsForEmail(key);
  const member = memberships[0];
  if (member?.userId) return { userId: member.userId };

  const bootstrap = process.env.AUTH_EMAIL?.trim().toLowerCase();
  if (bootstrap && bootstrap === key) {
    return { userId: process.env.AUTH_USER_ID?.trim() || "user_prod" };
  }

  return null;
}

export async function issueResetCode(input: {
  email: string;
  userId: string;
  now?: number;
}): Promise<{ status: "issued"; code: string } | { status: "throttled" }> {
  const email = normalizeResetEmail(input.email);
  const now = input.now ?? Date.now();
  const existing = await readRecord(email);
  if (isSendThrottled(existing, now)) {
    return { status: "throttled" };
  }

  const window = hourWindow(existing, now);
  const code = generateResetCode();
  const stamp = nowIso(now);
  await writeRecord({
    email,
    userId: input.userId,
    codeHash: hashResetCode(code),
    expiresAt: nowIso(now + RESET_CODE_TTL_MS),
    attempts: 0,
    createdAt: existing?.createdAt ?? stamp,
    lastSentAt: stamp,
    sendCountHour: window.count + 1,
    hourWindowStart: window.start,
  });
  return { status: "issued", code };
}

async function checkResetCode(
  email: string,
  code: string,
  now: number
): Promise<
  | { status: "ok"; record: PasswordResetRecord }
  | { status: "invalid" }
> {
  const normalizedCode = normalizeResetCode(code);
  const record = await readRecord(email);
  if (!record || normalizedCode.length !== 6) {
    return { status: "invalid" };
  }

  const expiresAt = Date.parse(record.expiresAt);
  if (!Number.isFinite(expiresAt) || now >= expiresAt) {
    await deleteRecord(email);
    return { status: "invalid" };
  }

  if (record.attempts >= RESET_MAX_VERIFY_ATTEMPTS) {
    await deleteRecord(email);
    return { status: "invalid" };
  }

  if (!resetCodesMatch(normalizedCode, record.codeHash)) {
    const attempts = record.attempts + 1;
    if (attempts >= RESET_MAX_VERIFY_ATTEMPTS) {
      await deleteRecord(email);
    } else {
      await writeRecord({ ...record, attempts });
    }
    return { status: "invalid" };
  }

  return { status: "ok", record };
}

export async function verifyResetCode(
  email: string,
  code: string,
  now = Date.now()
): Promise<VerifyResetCodeResult> {
  const result = await checkResetCode(email, code, now);
  if (result.status !== "ok") {
    return {
      ok: false,
      status: 400,
      code: "INVALID_CODE",
      message: INVALID_CODE_MESSAGE,
    };
  }
  return { ok: true, userId: result.record.userId };
}

export async function requestPasswordReset(
  email: string,
  now = Date.now()
): Promise<RequestPasswordResetResult> {
  if (!isDemoMode() && !isEmailConfigured()) {
    return {
      ok: false,
      status: 503,
      code: "EMAIL_UNAVAILABLE",
      message: EMAIL_UNAVAILABLE_MESSAGE,
    };
  }

  const key = normalizeResetEmail(email);
  const target = await resolveResetTarget(key);
  if (!target) {
    return { ok: true };
  }

  const issued = await issueResetCode({
    email: key,
    userId: target.userId,
    now,
  });
  if (issued.status === "issued") {
    try {
      await sendPasswordResetEmail({ email: key, code: issued.code });
    } catch (error) {
      console.error("[password-reset] email send failed", error);
    }
  }

  return { ok: true };
}

export async function completePasswordReset(input: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  now?: number;
}): Promise<CompletePasswordResetResult> {
  const passwordError = assertPasswordConfirmation(
    input.password,
    input.confirmPassword
  );
  if (passwordError) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: passwordError,
    };
  }

  const now = input.now ?? Date.now();
  const result = await checkResetCode(input.email, input.code, now);
  if (result.status !== "ok") {
    return {
      ok: false,
      status: 400,
      code: "INVALID_CODE",
      message: INVALID_CODE_MESSAGE,
    };
  }

  await upsertUserPassword({
    email: result.record.email,
    userId: result.record.userId,
    password: input.password,
  });
  await deleteRecord(result.record.email);

  return { ok: true, next: RESET_SUCCESS_NEXT };
}
