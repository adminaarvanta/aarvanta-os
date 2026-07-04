import { NextResponse } from "next/server";
import { z } from "zod";
import { crmNow } from "@/lib/data/crm-helpers";
import { getLegalStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { analyzeContractText, getLegalContractTemplate } from "@/lib/legal/analyze";
import { requirePermission } from "@/lib/tenant/context";
import type { LegalContractType } from "@/types/legal";

const analyzeSchema = z.object({
  content: z.string().min(20),
});

const generateSchema = z.object({
  type: z.enum(["nda", "msa", "employment", "supplier", "custom"]),
  title: z.string().optional(),
  brandName: z.string(),
  counterparty: z.string(),
});

export async function GET() {
  try {
    const ctx = await requirePermission("legal:read");
    const contracts = await getLegalStore().list(ctx.scope);
    return NextResponse.json({ contracts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("LEGAL_ERROR", message, status);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("legal:write");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const action =
      body && typeof body === "object" && "action" in body
        ? String((body as { action: string }).action)
        : "analyze";

    if (action === "analyze") {
      const parsed = analyzeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const analysis = analyzeContractText(parsed.data.content);
      return NextResponse.json(analysis);
    }

    if (action === "generate") {
      const parsed = generateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      const content = getLegalContractTemplate(parsed.data.type as LegalContractType, {
        brandName: parsed.data.brandName,
        counterparty: parsed.data.counterparty,
      });
      const analysis = analyzeContractText(content);
      const now = crmNow();
      const title =
        parsed.data.title ??
        `${parsed.data.type.toUpperCase()} — ${parsed.data.counterparty}`;

      const contract = await getLegalStore().create({
        ...ctx.scope,
        title,
        type: parsed.data.type,
        counterparty: parsed.data.counterparty,
        content,
        status: "draft",
        riskScore: analysis.riskScore,
        riskSummary: analysis.riskSummary,
        clauses: analysis.clauses,
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({ contract, analysis }, { status: 201 });
    }

    return apiError("INVALID_ACTION", "Use action: analyze or generate", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Legal action failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("LEGAL_ERROR", message, status);
  }
}
