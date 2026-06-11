import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let firestore: Firestore | undefined;

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
  if (!firestore) {
    firestore = getFirestore(adminApp);
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}
