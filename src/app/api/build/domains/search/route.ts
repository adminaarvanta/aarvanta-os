import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { searchDomainListings } from "@/lib/site-builder/domain-catalog";
import { getTenantScope } from "@/lib/tenant/context";

const searchSchema = z.object({
  businessName: z.string().min(2).max(80),
  countryBase: z.string().min(2).max(8).default("UK"),
  query: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const listings = searchDomainListings(parsed.data);
  return NextResponse.json({ listings });
}
