import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPasswordConfirmation } from "@/lib/account/passwords";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { AFFILIATE_COOKIE } from "@/lib/affiliate/cookie";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  applyAsExternalPartner,
  optInAsCustomerAffiliate,
} from "@/lib/affiliate/service";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const applySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  country: z.string().min(2).max(80),
  city: z.string().min(1).max(80),
  company: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  phone: z
    .string()
    .min(7)
    .max(24)
    .regex(/^[+0-9()\-\s]+$/, "Enter a valid phone number"),
  password: z.string().min(8).max(128).optional(),
  confirmPassword: z.string().min(8).max(128).optional(),
  marketingChannels: z.string().max(240).optional(),
  /** Optional parent partner referral code. */
  parentReferralCode: z.string().max(32).optional(),
});

/** Public partner application — auto-activated; set-password email sent. */
export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid application.",
      400
    );
  }

  let userId: string | undefined;
  let tenantId: string | undefined;
  try {
    const session = await getSessionContext();
    // Only link the session account when the applicant email matches —
    // otherwise an admin testing apply would steal the partner's userId.
    if (
      session.email.trim().toLowerCase() ===
      parsed.data.email.trim().toLowerCase()
    ) {
      userId = session.userId;
      tenantId = session.scope.tenantId;
    }
  } catch {
    /* anonymous apply */
  }

  if (!userId) {
    if (!parsed.data.password || !parsed.data.confirmPassword) {
      return apiError(
        "VALIDATION_ERROR",
        "Create and confirm your password here. We do not email temporary passwords.",
        400
      );
    }
    const passwordError = assertPasswordConfirmation(
      parsed.data.password,
      parsed.data.confirmPassword
    );
    if (passwordError) {
      return apiError("VALIDATION_ERROR", passwordError, 400);
    }
  }

  const cookieStore = await cookies();
  const parentReferralCode =
    parsed.data.parentReferralCode?.trim() ||
    cookieStore.get(AFFILIATE_COOKIE)?.value ||
    undefined;

  try {
    const { affiliate, activation, session } = await applyAsExternalPartner({
      name: parsed.data.name,
      email: parsed.data.email,
      country: parsed.data.country,
      city: parsed.data.city,
      company: parsed.data.company,
      website: parsed.data.website,
      phone: parsed.data.phone,
      marketingChannels: parsed.data.marketingChannels,
      password: userId ? undefined : parsed.data.password,
      parentReferralCode,
      userId,
      tenantId,
    });
    const response = NextResponse.json({
      affiliate,
      activation,
      next: "/onboarding",
    });
    if (session && (!isDemoMode() || process.env.AUTH_SECRET)) {
      try {
        const token = await createSessionToken(session);
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
      error instanceof Error ? error.message : "Application failed.";
    const status = /Firestore|FIREBASE|production/i.test(message) ? 503 : 400;
    console.error("[affiliate] apply failed", message);
    return apiError("AFFILIATE_APPLY_ERROR", message, status);
  }
}

/** Customer in-app referral opt-in → active affiliate. */
export async function PUT(req: Request) {
  let session;
  try {
    session = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const cookieStore = await cookies();
  let parentFromBody: string | undefined;
  try {
    const json = (await req.json()) as { parentReferralCode?: string };
    parentFromBody = json.parentReferralCode?.trim() || undefined;
  } catch {
    /* empty body */
  }

  try {
    const affiliate = await optInAsCustomerAffiliate({
      userId: session.userId,
      tenantId: session.scope.tenantId,
      email: session.email,
      name: session.name || session.email,
      country: session.member?.country || "United Kingdom",
      company: session.member?.companyName,
      parentReferralCode:
        parentFromBody || cookieStore.get(AFFILIATE_COOKIE)?.value,
    });
    return NextResponse.json({ affiliate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Opt-in failed.";
    return apiError("AFFILIATE_OPTIN_ERROR", message, 400);
  }
}
