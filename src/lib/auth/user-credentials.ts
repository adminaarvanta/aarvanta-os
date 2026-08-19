import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  isMemoryDatastore,
  withFirestoreFallback,
} from "@/lib/data/datastore";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { MemberAuthProvider } from "@/types/tenant";

export type UserCredentialRecord = {
  email: string;
  userId: string;
  passwordHash: string;
  passwordSalt: string;
  authProvider?: MemberAuthProvider;
  googleSub?: string;
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

function shouldUseCredentialMemory() {
  return isDemoMode() || !isFirebaseConfigured() || isMemoryDatastore();
}

async function readRecord(email: string): Promise<UserCredentialRecord | null> {
  const key = emailKey(email);
  if (shouldUseCredentialMemory()) {
    return memory.get(key) ?? null;
  }

  return withFirestoreFallback(
    async () => {
      const db = getAdminFirestore();
      if (!db) return memory.get(key) ?? null;
      const snap = await db.collection(COLLECTION).doc(key).get();
      if (!snap.exists) return null;
      const record = snap.data() as UserCredentialRecord;
      memory.set(key, record);
      return record;
    },
    () => memory.get(key) ?? null
  );
}

async function writeRecord(
  record: UserCredentialRecord
): Promise<UserCredentialRecord> {
  const key = emailKey(record.email);
  memory.set(key, record);
  if (shouldUseCredentialMemory()) {
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
    authProvider: "password",
    googleSub: existing?.googleSub,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export async function upsertGoogleIdentity(input: {
  email: string;
  userId: string;
  googleSub: string;
}): Promise<UserCredentialRecord> {
  const key = emailKey(input.email);
  const existing = await readRecord(key);
  const stamp = nowIso();
  return writeRecord({
    email: key,
    userId: input.userId,
    passwordHash: existing?.passwordHash ?? "",
    passwordSalt: existing?.passwordSalt ?? "",
    authProvider: existing?.passwordHash
      ? (existing.authProvider ?? "password")
      : "google",
    googleSub: input.googleSub,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export async function findCredentialsByGoogleSub(
  googleSub: string
): Promise<UserCredentialRecord | null> {
  const sub = googleSub.trim();
  if (!sub) return null;

  for (const record of memory.values()) {
    if (record.googleSub === sub) return record;
  }

  if (shouldUseCredentialMemory()) return null;

  return withFirestoreFallback(
    async () => {
      const db = getAdminFirestore();
      if (!db) return null;
      const snap = await db
        .collection(COLLECTION)
        .where("googleSub", "==", sub)
        .limit(1)
        .get();
      if (snap.empty) return null;
      const record = snap.docs[0]!.data() as UserCredentialRecord;
      memory.set(record.email, record);
      return record;
    },
    () => {
      for (const record of memory.values()) {
        if (record.googleSub === sub) return record;
      }
      return null;
    }
  );
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<UserCredentialRecord | null> {
  const record = await readRecord(email);
  if (!record?.passwordHash || !record.passwordSalt) return null;
  if (!verifyPassword(password, record.passwordHash, record.passwordSalt)) {
    return null;
  }
  return record;
}
