import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { completePasswordReset } from "@/lib/auth/password-reset";
import { ensureDatastoreReady } from "@/lib/data/datastore";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().min(4).max(12),
  password: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  await ensureDatastoreReady();
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid reset details.",
      400
    );
  }

  const result = await completePasswordReset({
    email: parsed.data.email,
    code: parsed.data.code,
    password: parsed.data.password,
    confirmPassword: parsed.data.confirmPassword,
  });
  if (!result.ok) {
    return apiError(result.code, result.message, result.status);
  }

  return NextResponse.json({ ok: true, next: result.next });
}
