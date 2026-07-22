import {
  getDomainRetailMarkupPct,
  getDomainUsdToGbpRate,
} from "@/lib/registrars/opensrs-config";

/** Convert OpenSRS wholesale USD → retail price in the shopper currency. */
export function wholesaleToRetail(input: {
  wholesaleUsd: number;
  currency: "GBP" | "USD";
  markupPct?: number;
  usdToGbpRate?: number;
}): number {
  const markupPct = input.markupPct ?? getDomainRetailMarkupPct();
  const rate = input.usdToGbpRate ?? getDomainUsdToGbpRate();
  const markedUp = input.wholesaleUsd * (1 + markupPct / 100);
  const inCurrency = input.currency === "GBP" ? markedUp * rate : markedUp;
  return Math.round(inCurrency * 100) / 100;
}
