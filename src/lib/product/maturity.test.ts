import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRODUCT_MODULES,
  containsMarketingOs,
  publicCapabilities,
} from "@/lib/product/maturity";
import { TRIAL_POLICY } from "@/lib/product/trial";

describe("product truth", () => {
  it("never lists MarketingOS as a module", () => {
    for (const module of PRODUCT_MODULES) {
      assert.equal(containsMarketingOs(module.label), false);
      assert.equal(containsMarketingOs(module.description), false);
      assert.equal(containsMarketingOs(module.href), false);
    }
  });

  it("does not advertise gated preview modules as public live capabilities", () => {
    const publicIds = publicCapabilities().map((module) => module.id);
    assert.equal(publicIds.includes("outreach"), false);
    assert.equal(publicIds.includes("whatsapp"), false);
    assert.equal(publicIds.includes("payroll"), false);
  });

  it("uses a free-plan policy instead of a numbered trial", () => {
    assert.equal(TRIAL_POLICY.kind, "free_plan");
    assert.equal(/14/.test(TRIAL_POLICY.copy), false);
    assert.equal(/day/i.test(TRIAL_POLICY.copy), false);
  });
});
