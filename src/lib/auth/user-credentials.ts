import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isDemoMode } from "@/lib/config/app-mode";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type UserCredentialRecord = {
  email: string;
  userId: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

const COLLECTION = "user_credentials";
const memory = new Map<string, UserCredentialRecord>();

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

async function readRecord(email: string): Promise<UserCredentialRecord | null> {
  const key = emailKey(email);
  if (isDemoMode() || !isFirebaseConfigured()) {
    return memory.get(key) ?? null;
  }
  const db = getAdminFirestore();
  if (!db) return memory.get(key) ?? null;
  const snap = await db.collection(COLLECTION).doc(key).get();
  if (!snap.exists) return null;
  return snap.data() as UserCredentialRecord;
}

async function writeRecord(
  record: UserCredentialRecord
): Promise<UserCredentialRecord> {
  const key = emailKey(record.email);
  memory.set(key, record);
  if (!isDemoMode() && isFirebaseConfigured()) {
    const db = getAdminFirestore();
    if (db) {
      await db.collection(COLLECTION).doc(key).set(record);
    }
  }
  return record;
}

export async function getUserCredentials(
  email: string
): Promise<UserCredentialRecord | null> {
  return readRecord(email);
}

export async function hasUserPassword(email: string): Promise<boolean> {
  const record = await readRecord(email);
  return Boolean(record?.passwordHash && record?.passwordSalt);
}

export async function upsertUserPassword(input: {
  email: string;
  userId: string;
  password: string;
}): Promise<UserCredentialRecord> {
  const key = emailKey(input.email);
  const existing = await readRecord(key);
  const { hash, salt } = hashPassword(input.password);
  const stamp = nowIso();
  return writeRecord({
    email: key,
    userId: input.userId,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<UserCredentialRecord | null> {
  const record = await readRecord(email);
  if (!record) return null;
  if (!verifyPassword(password, record.passwordHash, record.passwordSalt)) {
    return null;
  }
  return record;
}
