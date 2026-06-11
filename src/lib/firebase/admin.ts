import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

declare global {
  // Next.js may load multiple server bundles; guard settings() to once per process.
  var __aarvantaFirestoreSettings: boolean | undefined;
}

let app: App | undefined;

export function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

export function getAdminApp() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
  }
  return app;
}

export function getAdminFirestore() {
  const adminApp = getAdminApp();
  if (!adminApp) return null;

  const db = getFirestore(adminApp);

  if (!globalThis.__aarvantaFirestoreSettings) {
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch (error) {
      console.warn(
        "[firebase] Firestore settings skipped:",
        error instanceof Error ? error.message : error
      );
    }
    globalThis.__aarvantaFirestoreSettings = true;
  }

  return db;
}
