import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCredentials } from "@/lib/auth/credentials";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { assertProductionConfig } from "@/lib/config/app-mode";
import { apiError, parseJsonBody } from "@/lib/api/request";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    assertProductionConfig();
  } catch (error) {
    return apiError(
      "MISCONFIGURED",
      error instanceof Error ? error.message : "Invalid production config",
      500
    );
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid credentials payload", 400);
  }

  const session = validateCredentials(parsed.data.email, parsed.data.password);
  if (!session) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const token = await createSessionToken(session);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
  return response;
}
