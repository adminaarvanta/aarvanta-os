import { NextResponse } from "next/server";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { disableFirestoreFallback, isFirestoreQuotaError } from "@/lib/data/datastore";
import type { Organization } from "@/types/tenant";
import type { Subscription } from "@/types/platform-modules";
import type { WorkspaceMember } from "@/types/tenant";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret =
    process.env.PLATFORM_ADMIN_SECRET?.trim() ||
    process.env.ONBOARDING_SIDECAR_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-platform-admin-secret") === secret;
}

async function collect<T>(collection: string): Promise<T[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  const snap = await db.collection(collection).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

/** Cross-tenant SaaS snapshot for admin.aarvanta.co platform panel. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase not configured on OS" },
      { status: 503 }
    );
  }

  try {
    const [organizations, members, subscriptions, affiliates, attributions, leadEvents, earnings, payments] =
      await Promise.all([
        collect<Organization>("tenant_organizations"),
        collect<WorkspaceMember>("tenant_members"),
        collect<Subscription>("billing_subscriptions"),
        affiliateStore.listAffiliates(),
        affiliateStore.listAttributions(),
        affiliateStore.listLeadEvents(),
        affiliateStore.listEarnings(),
        collect<Record<string, unknown>>("stripe_payments"),
      ]);

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      organizations,
      members,
      subscriptions,
      affiliates,
      attributions,
      leadEvents,
      earnings,
      payments,
    });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      disableFirestoreFallback(
        error instanceof Error ? error.message : String(error)
      );
      return NextResponse.json(
        {
          error: "Firestore quota exceeded",
          message:
            "Enable Firebase Blaze billing or wait for quota reset. os.aarvanta.co is also on memory fallback.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
