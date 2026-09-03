import { apiError } from "@/lib/api/request";
import { buildCreditAccessRoster } from "@/lib/billing/credit-access-roster";
import { requireSuperAdminSession } from "@/lib/billing/super-admin";
import { getTenantRepository } from "@/lib/data/tenant-store";

/** Super-admin roster for voice + Email OS credit grants (all product users). */
export async function GET() {
  try {
    await requireSuperAdminSession();
    const members = await buildCreditAccessRoster(getTenantRepository());
    return Response.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("CREDIT_ACCESS_ERROR", message, status);
  }
}
