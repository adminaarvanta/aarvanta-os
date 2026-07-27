import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import {
  PENDING_SIGNUP_COOKIE,
  getPendingSignupCookieOptions,
  verifyPendingSignupToken,
} from "@/lib/auth/pending-signup";
import { provisionFreeTierAccount } from "@/lib/auth/provision-free-account";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/app-mode";
import { ensureDatastoreReady } from "@/lib/data/datastore";

export const runtime = "nodejs";

const completeSchema = z.object({
  phone: z
    .string()
    .min(7)
    .max(24)
    .regex(/^[+0-9()\-\s]+$/, "Enter a valid phone number"),
  country: z.string().min(2).max(80),
  companyName: z.string().max(120).optional(),
  name: z.string().min(1).max(80).optional(),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatastoreReady();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid profile details.",
        400
      );
    }

    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;
    if (!pendingToken) {
      return apiError(
        "PENDING_EXPIRED",
        "Your Google sign-up session expired. Please start again.",
        401
      );
    }

    const pending = await verifyPendingSignupToken(pendingToken);
    if (!pending) {
      return apiError(
        "PENDING_EXPIRED",
        "Your Google sign-up session expired. Please start again.",
        401
      );
    }

    const result = await provisionFreeTierAccount({
      email: pending.email,
      name: parsed.data.name?.trim() || pending.name,
      phone: parsed.data.phone,
      country: parsed.data.country,
      companyName: parsed.data.companyName,
      googleSub: pending.googleSub,
      authProvider: "google",
    });

    const nextPath = sanitizeNextPath(
      parsed.data.next ?? pending.next ?? "/build"
    );
    const response = NextResponse.json({
      ok: true,
      next: nextPath,
      plan: "free",
      demo: isDemoMode(),
    });

    response.cookies.set(PENDING_SIGNUP_COOKIE, "", {
      ...getPendingSignupCookieOptions(req.url),
      maxAge: 0,
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
      error instanceof Error ? error.message : "Could not complete signup.";
    if (/already exists/i.test(message)) {
      return apiError("EMAIL_EXISTS", message, 409);
    }
    return apiError("REGISTER_ERROR", message, 500);
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;
  if (!pendingToken) {
    return NextResponse.json({ pending: false });
  }
  const pending = await verifyPendingSignupToken(pendingToken);
  if (!pending) {
    return NextResponse.json({ pending: false });
  }
  return NextResponse.json({
    pending: true,
    email: pending.email,
    name: pending.name,
  });
}
