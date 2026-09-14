import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchDomainListings } from "@/lib/site-builder/domain-catalog";
import { searchDomainListingsAsync } from "@/lib/site-builder/domain-search";

describe("searchDomainListings demo catalog", () => {
  it("labels sample prices and never claims name.com", () => {
    const listings = searchDomainListings({
      businessName: "Bright Smile Dental",
      countryBase: "UK",
    });
    assert.ok(listings.length > 0);
    for (const listing of listings) {
      assert.doesNotMatch(listing.note, /name\.com/i);
      assert.doesNotMatch(listing.note, /live price/i);
      assert.match(listing.note, /demo|simulated|sample/i);
      assert.ok(listing.priceAnnual > 0);
    }
  });
});

describe("searchDomainListingsAsync", () => {
  it("returns the demo catalog in demo mode without claiming a live registrar", async () => {
    const priorMode = process.env.APP_MODE;
    const priorForceName = process.env.NAMECOM_FORCE_LIVE;
    const priorForceSrs = process.env.OPENSRS_FORCE_LIVE;
    delete process.env.APP_MODE;
    delete process.env.NAMECOM_FORCE_LIVE;
    delete process.env.OPENSRS_FORCE_LIVE;
    try {
      const result = await searchDomainListingsAsync({
        businessName: "Bright Smile Dental",
        countryBase: "UK",
      });
      assert.equal(result.source, "demo");
      assert.ok(result.listings.length > 0);
      for (const listing of result.listings) {
        assert.doesNotMatch(listing.note, /name\.com/i);
      }
    } finally {
      if (priorMode === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = priorMode;
      if (priorForceName === undefined) delete process.env.NAMECOM_FORCE_LIVE;
      else process.env.NAMECOM_FORCE_LIVE = priorForceName;
      if (priorForceSrs === undefined) delete process.env.OPENSRS_FORCE_LIVE;
      else process.env.OPENSRS_FORCE_LIVE = priorForceSrs;
    }
  });

  it("does not return a hardcoded catalog in production without a registrar", async () => {
    const prior = {
      APP_MODE: process.env.APP_MODE,
      NAMECOM_USERNAME: process.env.NAMECOM_USERNAME,
      NAMECOM_API_TOKEN: process.env.NAMECOM_API_TOKEN,
      NAMECOM_API_TOKEN_DEV: process.env.NAMECOM_API_TOKEN_DEV,
      OPENSRS_USERNAME: process.env.OPENSRS_USERNAME,
      OPENSRS_API_KEY: process.env.OPENSRS_API_KEY,
      NAMECOM_FORCE_LIVE: process.env.NAMECOM_FORCE_LIVE,
      OPENSRS_FORCE_LIVE: process.env.OPENSRS_FORCE_LIVE,
    };
    process.env.APP_MODE = "production";
    delete process.env.NAMECOM_USERNAME;
    delete process.env.NAMECOM_API_TOKEN;
    delete process.env.NAMECOM_API_TOKEN_DEV;
    delete process.env.OPENSRS_USERNAME;
    delete process.env.OPENSRS_API_KEY;
    delete process.env.NAMECOM_FORCE_LIVE;
    delete process.env.OPENSRS_FORCE_LIVE;
    try {
      const result = await searchDomainListingsAsync({
        businessName: "Bright Smile Dental",
        countryBase: "UK",
      });
      assert.equal(result.source, "unavailable");
      assert.equal(result.listings.length, 0);
      assert.match(result.message ?? "", /name\.com or OpenSRS/i);
    } finally {
      for (const [key, value] of Object.entries(prior)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
