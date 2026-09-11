import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRefineHeuristics } from "@/lib/site-builder/apply-refine";
import {
  inferCategoryFromPrompt,
  inferPreferencesFromPrompt,
  promptImpliesStore,
} from "@/lib/site-builder/infer-preferences";
import { resolveTemplatePrior } from "@/lib/site-builder/templates/resolve-template";
import type { GeneratedSite } from "@/types/site-builder";

describe("promptImpliesStore", () => {
  it("detects clear ecommerce briefs", () => {
    assert.equal(
      promptImpliesStore("Artisan candles online store with checkout"),
      true
    );
    assert.equal(promptImpliesStore("We sell handmade soaps online"), true);
  });

  it("does not treat simple business websites as stores", () => {
    assert.equal(
      promptImpliesStore(
        "North Peak Dental — modern family dentist. Simple website to book appointments."
      ),
      false
    );
    assert.equal(
      promptImpliesStore("Acme Consulting — professional services company website"),
      false
    );
  });
});

describe("inferPreferencesFromPrompt", () => {
  it("defaults simple briefs to a business site, not a store", () => {
    const prefs = inferPreferencesFromPrompt(
      "Bright Smile Dental — calm family dentist. Simple website for bookings.",
      { features: ["contact_form"], keyMessages: "Generate leads" }
    );
    assert.notEqual(prefs.siteType, "store");
    assert.equal(prefs.features.includes("ecommerce"), false);
    assert.notEqual(prefs.ctaGoal, "buy");
    assert.equal(prefs.pages.includes("products"), false);
    assert.notEqual(prefs.categoryId, "ecommerce");
  });

  it("keeps store briefs as stores when ecommerce is requested", () => {
    const prefs = inferPreferencesFromPrompt(
      "Artisan Candles Co — handmade soy candles. Gift-ready online shop.",
      {
        features: ["ecommerce", "contact_form"],
        keyMessages: "Sell more products online",
      }
    );
    assert.equal(prefs.siteType, "store");
    assert.equal(prefs.features.includes("ecommerce"), true);
  });
});

describe("resolveTemplatePrior", () => {
  it("falls back to a business template instead of ecommerce", () => {
    const tpl = resolveTemplatePrior();
    assert.notEqual(tpl.siteType, "store");
    assert.notEqual(tpl.categoryId, "ecommerce");
  });
});

describe("inferCategoryFromPrompt", () => {
  it("maps healthcare and professional briefs away from ecommerce", () => {
    assert.equal(inferCategoryFromPrompt("Family dentist in Manchester"), "healthcare");
    assert.equal(
      inferCategoryFromPrompt("Simple business website for a consulting firm"),
      "professional"
    );
  });
});

function sampleSite(): GeneratedSite {
  return {
    siteName: "Acme",
    slug: "acme",
    tagline: "Hello",
    footerNote: "© 2026 Acme",
    theme: {
      presetId: "minimal_light",
      primaryColor: "#1A2B48",
      accentColor: "#3D6B9F",
      backgroundColor: "#FFFFFF",
      fontStyle: "sans",
      styleNotes: "clean",
    },
    brand: {
      primary: "#1A2B48",
      secondary: "#3D6B9F",
      background: "#FFFFFF",
      font: "sans",
      headingFont: "serif",
      style: "Modern",
      toneOfVoice: "Friendly",
      animation: "Subtle",
      imageStyle: "Photo",
      fontPackId: "modern_sans",
      buttonRadius: "md",
      spacingScale: "Comfortable",
      iconSet: "lucide",
      navStyle: "minimal",
    },
    navigation: [{ label: "Home", slug: "home" }],
    pages: [
      {
        slug: "home",
        title: "Home",
        blocks: [
          {
            id: "hero1",
            type: "hero",
            variantId: "centered",
            props: {
              headline: "Old headline",
              subheadline: "Old sub",
              cta: "Contact",
            },
          },
        ],
      },
    ],
    assets: [],
    generatedAt: new Date().toISOString(),
    version: 1,
  };
}

describe("applyRefineHeuristics", () => {
  it("updates the hero headline from a free-form change request", () => {
    const next = applyRefineHeuristics(
      sampleSite(),
      'Change the headline to "Welcome to Bright Smile"'
    );
    const hero = next.pages[0]?.blocks[0];
    assert.equal(hero?.props.headline, "Welcome to Bright Smile");
    assert.equal(next.version, 2);
  });

  it("applies named theme colours", () => {
    const next = applyRefineHeuristics(sampleSite(), "Make the theme greener");
    assert.equal(next.brand?.primary, "#16A34A");
  });
});
