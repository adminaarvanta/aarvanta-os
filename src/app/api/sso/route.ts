import { NextResponse } from "next/server";
import { z } from "zod";
import { getSsoStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantScope, requirePermission } from "@/lib/tenant/context";
import type { SsoProvider } from "@/types/platform-modules";

const createSchema = z.object({
  provider: z.enum(["entra", "google", "okta", "onelogin"]),
  domain: z.string().min(3),
  protocol: z.enum(["saml", "oidc", "oauth"]).default("oidc"),
  mfaRequired: z.boolean().optional(),
  scimEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const scope = await getTenantScope();
    const connections = await getSsoStore().list(scope);
    return NextResponse.json({ connections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("SSO_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("workspace:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const connection = await getSsoStore().create({
      ...ctx.scope,
      provider: parsed.data.provider as SsoProvider,
      protocol: parsed.data.protocol,
      domain: parsed.data.domain,
      status: "inactive",
      mfaRequired: parsed.data.mfaRequired ?? true,
      scimEnabled: parsed.data.scimEnabled ?? false,
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("SSO_ERROR", message, status);
  }
}
