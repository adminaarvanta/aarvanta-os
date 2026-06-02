import { isFirebaseConfigured } from "@/lib/firebase/admin";

export type AppMode = "demo" | "production";

export function getAppMode(): AppMode {
  return process.env.APP_MODE === "production" ? "production" : "demo";
}

export function isProductionMode(): boolean {
  return getAppMode() === "production";
}

export function isDemoMode(): boolean {
  return !isProductionMode();
}

/** Validates required production env vars. Call at startup-sensitive paths. */
export function assertProductionConfig(): void {
  if (!isProductionMode()) return;

  const missing: string[] = [];

  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.AUTH_EMAIL) missing.push("AUTH_EMAIL");
  if (!process.env.AUTH_PASSWORD) missing.push("AUTH_PASSWORD");
  if (!process.env.TENANT_ID) missing.push("TENANT_ID");
  if (!process.env.WORKSPACE_ID) missing.push("WORKSPACE_ID");
  if (!process.env.COMPANY_ID) missing.push("COMPANY_ID");

  if (!isFirebaseConfigured()) {
    missing.push(
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Production mode requires: ${missing.join(", ")}. Set APP_MODE=demo for local demo.`
    );
  }
}
