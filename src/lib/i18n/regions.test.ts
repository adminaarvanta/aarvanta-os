import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COUNTRIES,
  COUNTRY_NAMES,
  defaultsForCountry,
  formatDateForPrefs,
  formatMoneyForLocale,
  regionCodeForCountry,
} from "@/lib/i18n/regions";

describe("regions catalog", () => {
  it("includes core countries used at signup", () => {
    for (const name of [
      "United Kingdom",
      "United States",
      "India",
      "Singapore",
      "United Arab Emirates",
    ]) {
      assert.ok(COUNTRY_NAMES.includes(name), name);
    }
  });

  it("maps country names to regional rate codes", () => {
    assert.equal(regionCodeForCountry("United Kingdom"), "uk");
    assert.equal(regionCodeForCountry("India"), "india");
    assert.equal(regionCodeForCountry("Germany"), "eu");
    assert.equal(regionCodeForCountry("Unknownland"), "global");
  });

  it("returns locale defaults for a country", () => {
    const india = defaultsForCountry("India");
    assert.equal(india.currency, "INR");
    assert.equal(india.timezone, "Asia/Kolkata");
    assert.equal(india.locale, "en-IN");
  });

  it("formats money and dates for regional prefs", () => {
    assert.match(formatMoneyForLocale(49, "GBP", "en-GB"), /£49/);
    const formatted = formatDateForPrefs(
      "2026-12-31T14:30:00.000Z",
      "en-GB",
      "year_month_day",
      "24h"
    );
    assert.match(formatted, /2026-12-31/);
  });

  it("keeps unique country names", () => {
    assert.equal(new Set(COUNTRIES.map((c) => c.name)).size, COUNTRIES.length);
  });
});
