import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { AFFILIATE_COOKIE } from "@/lib/affiliate/cookie";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { provisionFreeTierAccount } from "@/lib/auth/provision-free-account";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { hasUserPassword } from "@/lib/auth/user-credentials";
import { isDemoMode } from "@/lib/config/app-mode";
import { ensureDatastoreReady } from "@/lib/data/datastore";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80),
  phone: z
    .string()
    .min(7)
    .max(24)
    .regex(/^[+0-9()\-\s]+$/, "Enter a valid phone number"),
  country: z.string().min(2).max(80),
  companyName: z.string().max(120).optional(),
  referralCode: z.string().max(32).optional(),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatastoreReady();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid registration details.",
        400
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    if (await hasUserPassword(email)) {
      return apiError(
        "EMAIL_EXISTS",
        "An account with this email already exists. Please sign in.",
        409
      );
    }

    const cookieStore = await cookies();
    const referralCode =
      parsed.data.referralCode?.trim() ||
      cookieStore.get(AFFILIATE_COOKIE)?.value ||
      undefined;

    const result = await provisionFreeTierAccount({
      email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      country: parsed.data.country,
      companyName: parsed.data.companyName,
      password: parsed.data.password,
      authProvider: "password",
      referralCode,
    });

    const nextPath = sanitizeNextPath(parsed.data.next ?? "/dashboard");
    const response = NextResponse.json({
      ok: true,
      next: nextPath,
      plan: "free",
      demo: isDemoMode(),
    });

    if (!isDemoMode() || process.env.AUTH_SECRET) {
      try {
        const token = await createSessionToken(result.session);
        response.cookies.set(
          SESSION_COOKIE,
          token,
          getSessionCookieOptions(undefined, req.url)
        );
      } catch {
        /* demo without AUTH_SECRET */
      }
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed.";
    if (/already exists/i.test(message)) {
      return apiError("EMAIL_EXISTS", message, 409);
    }
    return apiError("REGISTER_ERROR", message, 500);
  }
}
