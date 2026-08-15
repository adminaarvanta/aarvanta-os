import { NextResponse } from "next/server";
import {
  AFFILIATE_COOKIE,
  getAffiliateCookieOptions,
} from "@/lib/affiliate/cookie";
import {
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  normalizeReferralCode,
} from "@/lib/affiliate/constants";
import {
  recordAffiliateClick,
  resolveRatesForRegion,
} from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";

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

  const joinAsPartner =
    new URL(req.url).searchParams.get("join") === "partner" ||
    new URL(req.url).searchParams.get("as") === "partner";

  if (!affiliate) {
    const existing = await affiliateStore.getAffiliateByCode(
      normalizeReferralCode(code)
    );
    const dest = joinAsPartner ? "/affiliate" : "/register";
    const destUrl = new URL(dest, req.url);
    destUrl.searchParams.set(
      "aff",
      existing && existing.status !== "active" ? "pending" : "invalid"
    );
    return NextResponse.redirect(destUrl);
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

  const destUrl = new URL(joinAsPartner ? "/affiliate" : "/register", req.url);
  destUrl.searchParams.set("ref", affiliate.referralCode);

  const response = NextResponse.redirect(destUrl);
  response.cookies.set(
    AFFILIATE_COOKIE,
    affiliate.referralCode,
    getAffiliateCookieOptions(maxAge, req.url)
  );
  return response;
}
