import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  csvEscape,
  filenameForExport,
  flattenForCsv,
  permittedDatasets,
  toCsv,
} from "@/lib/account/export";

describe("account export helpers", () => {
  it("escapes csv cells", () => {
    assert.equal(csvEscape('Hello, "world"'), '"Hello, ""world"""');
    assert.equal(csvEscape(null), "");
  });

  it("builds a csv table from objects", () => {
    const csv = toCsv([
      { name: "Ada", city: "London" },
      { name: "Lin", notes: "Needs follow-up" },
    ]);
    assert.match(csv, /name,city,notes/);
    assert.match(csv, /Ada,London,/);
    assert.match(csv, /Lin,,Needs follow-up/);
  });

  it("flattens nested values for csv", () => {
    const [row] = flattenForCsv([
      { tags: ["hot", "vip"], profile: { country: "IN" } },
    ]);
    assert.equal(row.tags, "hot; vip");
    assert.equal(row.profile, '{"country":"IN"}');
  });

  it("scopes datasets to permissions", () => {
    assert.deepEqual(
      permittedDatasets({
        canReadCrm: false,
        canManageOrg: false,
        isAffiliate: true,
      }),
      ["account", "affiliate"]
    );
    assert.deepEqual(
      permittedDatasets({
        canReadCrm: true,
        canManageOrg: true,
        isAffiliate: false,
      }),
      ["account", "contacts", "companies", "deals", "members"]
    );
  });

  it("names download files with the dataset", () => {
    assert.equal(
      filenameForExport("affiliate", "csv", new Date("2026-09-08T12:00:00Z")),
      "aarvanta-affiliate-2026-09-08.csv"
    );
  });
});
