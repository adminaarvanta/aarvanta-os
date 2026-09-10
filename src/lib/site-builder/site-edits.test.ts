import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRefineHeuristics } from "@/lib/site-builder/apply-refine";
import { parseRefineOps } from "@/lib/site-builder/parse-refine-ops";
import { applySiteEdits } from "@/lib/site-builder/site-edits";
import type { GeneratedSite } from "@/types/site-builder";

function siteFixture(): GeneratedSite {
  return {
    siteName: "Acme Studio",
    slug: "acme-studio",
    tagline: "Acme makes it simple",
    footerNote: "© Acme",
    version: 1,
    theme: {
      presetId: "minimal_light",
      primaryColor: "#111827",
      accentColor: "#B8965D",
      backgroundColor: "#FFFFFF",
      fontStyle: "sans",
      styleNotes: "",
    },
    navigation: [
      { label: "Home", slug: "home" },
      { label: "About Acme", slug: "about" },
    ],
    pages: [
      {
        slug: "home",
        title: "Home",
        blocks: [
          {
            id: "hero",
            type: "hero",
            props: {
              headline: "Original headline",
              subheadline: "Original sub",
              cta: "Contact us",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        blocks: [
          {
            id: "about_split",
            type: "about_split",
            props: {
              title: "The story of Acme",
              body: "We started Acme in 2019.",
            },
          },
        ],
      },
    ],
    generatedAt: "2026-09-05T00:00:00.000Z",
  };
}

describe("parseRefineOps + applySiteEdits", () => {
  it("changes the home hero headline from a marketing-style prompt", () => {
    const site = siteFixture();
    const next = applyRefineHeuristics(site, "Make the hero say Welcome Home");
    const hero = next.pages[0]?.blocks.find((block) => block.type === "hero");
    assert.equal(hero?.props.headline, "Welcome Home");
    assert.equal(next.version, 2);
    assert.notEqual(next.generatedAt, site.generatedAt);
  });

  it("sets an about page title", () => {
    const result = applySiteEdits(
      siteFixture(),
      parseRefineOps("change the about page title to Our Story")
    );
    const about = result.site.pages.find((page) => page.slug === "about");
    assert.equal(result.changed, true);
    assert.equal(about?.title, "Our Story");
    assert.equal(about?.blocks[0]?.props.title, "Our Story");
  });

  it("replaces brand copy across pages", () => {
    const result = applySiteEdits(
      siteFixture(),
      parseRefineOps("replace Acme with Nebula")
    );
    assert.equal(result.changed, true);
    assert.equal(result.site.siteName, "Nebula Studio");
    assert.match(String(result.site.pages[1]?.blocks[0]?.props.body), /Nebula/);
    assert.equal(result.site.navigation[1]?.label, "About Nebula");
  });

  it("applies a named theme palette", () => {
    const result = applySiteEdits(
      siteFixture(),
      parseRefineOps("make the theme green")
    );
    assert.equal(result.changed, true);
    assert.equal(result.site.theme.primaryColor, "#16A34A");
    assert.equal(result.site.theme.presetId, "custom");
  });

  it("sets a CTA from everyday language", () => {
    const result = applySiteEdits(siteFixture(), parseRefineOps("CTA to Book a call"));
    assert.equal(result.changed, true);
    assert.equal(result.site.pages[0]?.blocks[0]?.props.cta, "Book a call");
  });

  it("does not claim a change for a vague no-op", () => {
    const site = siteFixture();
    const next = applyRefineHeuristics(site, "please make it better somehow");
    assert.equal(next.version, site.version);
    assert.equal(
      next.pages[0]?.blocks[0]?.props.headline,
      "Original headline"
    );
    const parsed = parseRefineOps("please make it better somehow");
    assert.equal(parsed[0]?.type, "noop");
    const applied = applySiteEdits(site, parsed);
    assert.equal(applied.changed, false);
    assert.equal(applied.applied.length, 0);
  });
});
