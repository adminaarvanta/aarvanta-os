import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBuildGenerateAllowed } from "@/lib/billing/consume";
import { isSurgicalRefine } from "@/lib/site-builder/refine-history";

describe("build generate billing vs surgical refine", () => {
  it("allows copy/theme refine on Free after the first generate", () => {
    assert.equal(
      isSurgicalRefine("refine", { generatedSite: { version: 1 } }, "Make the hero say Welcome Home"),
      true
    );
    assert.equal(
      isBuildGenerateAllowed({
        buildDraftsLimit: 1,
        allowRefine: true,
        alreadyGenerated: true,
      }),
      true
    );
  });

  it("still blocks a full regenerate on Free after the first generate", () => {
    assert.equal(
      isSurgicalRefine("generate", { generatedSite: { version: 1 } }, undefined),
      false
    );
    assert.equal(
      isSurgicalRefine("regenerate", { generatedSite: { version: 1 } }, "start over"),
      false
    );
    assert.equal(
      isBuildGenerateAllowed({
        buildDraftsLimit: 1,
        allowRefine: false,
        alreadyGenerated: true,
      }),
      false
    );
  });

  it("does not treat layout or image rebuilds as surgical refine", () => {
    assert.equal(
      isSurgicalRefine("refine", { generatedSite: {} }, "add a page for pricing"),
      false
    );
    assert.equal(
      isSurgicalRefine("refine", { generatedSite: {} }, "replace the hero image"),
      false
    );
    assert.equal(
      isSurgicalRefine("refine", { generatedSite: {} }, "Make the hero say Welcome Home"),
      true
    );
  });

  it("allows paid / unlimited generate after the first draft", () => {
    assert.equal(
      isBuildGenerateAllowed({
        buildDraftsLimit: "unlimited",
        alreadyGenerated: true,
      }),
      true
    );
  });
});
