import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COMPANY, PRICING_TIERS } from "@/lib/marketing/content";
import { PRODUCT_MODULES, containsMarketingOs } from "@/lib/product/maturity";
import { TRIAL_POLICY } from "@/lib/product/trial";

describe("public copy honesty", () => {
  it("never sells MarketingOS on public surfaces", () => {
    const blobs = [
      COMPANY.name,
      COMPANY.tagline,
      COMPANY.subtagline,
      ...PRICING_TIERS.flatMap((tier) => [tier.name, tier.description, ...tier.features]),
      ...PRODUCT_MODULES.flatMap((module) => [module.label, module.description]),
    ];
    for (const text of blobs) {
      assert.equal(containsMarketingOs(text), false, text);
    }
  });

  it("does not advertise a numbered trial", () => {
    assert.equal(/14/.test(TRIAL_POLICY.copy), false);
    for (const tier of PRICING_TIERS) {
      assert.equal(/14-day/i.test(tier.description), false);
      for (const feature of tier.features) {
        assert.equal(/14-day/i.test(feature), false);
      }
    }
  });
});
