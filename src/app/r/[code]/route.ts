import { NextResponse } from "next/server";
import {
  AFFILIATE_COOKIE,
  getAffiliateCookieOptions,
} from "@/lib/affiliate/cookie";
import { DEFAULT_ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliate/constants";
import {
  recordAffiliateClick,
  resolveRatesForRegion,
} from "@/lib/affiliate/service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ code: string }> };

/** Public referral landing: record click, set cookie, redirect to free signup. */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip");

  const { affiliate } = await recordAffiliateClick({
    code,
    landingPath: `/r/${code}`,
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip,
  });

  if (!affiliate) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  const rates = await resolveRatesForRegion(
    affiliate.profile.regionCode,
    affiliate
  );
  const maxAge =
    (rates.attributionWindowDays || DEFAULT_ATTRIBUTION_WINDOW_DAYS) *
    24 *
    60 *
    60;

  const registerUrl = new URL("/register", req.url);
  registerUrl.searchParams.set("ref", affiliate.referralCode);

  const response = NextResponse.redirect(registerUrl);
  response.cookies.set(
    AFFILIATE_COOKIE,
    affiliate.referralCode,
    getAffiliateCookieOptions(maxAge, req.url)
  );
  return response;
}
