import { NextResponse } from "next/server";
import { z } from "zod";
import { getProposalStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

const createProposalSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  value: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  content: z.string().optional(),
  brandingOrg: z.string().optional(),
});

export async function GET() {
  try {
    const scope = await getTenantScope();
    const proposals = await getProposalStore().list(scope);
    return NextResponse.json({ proposals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("PROPOSALS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const scope = await getTenantScope();
    const store = getProposalStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid proposal payload", 400);
    }

    const proposal = await store.create({
      ...scope,
      title: parsed.data.title,
      clientName: parsed.data.clientName,
      value: parsed.data.value ?? 0,
      currency: parsed.data.currency ?? "USD",
      content: parsed.data.content ?? "",
      brandingOrg: parsed.data.brandingOrg ?? "Default",
      status: "draft",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("PROPOSALS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
