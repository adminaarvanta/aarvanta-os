import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { verifyResetCode } from "@/lib/auth/password-reset";
import { ensureDatastoreReady } from "@/lib/data/datastore";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().min(4).max(12),
});

export async function POST(req: Request) {
  await ensureDatastoreReady();
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Enter the verification code.",
      400
    );
  }

  const result = await verifyResetCode(parsed.data.email, parsed.data.code);
  if (!result.ok) {
    return apiError(result.code, result.message, result.status);
  }

  return NextResponse.json({ ok: true });
}
