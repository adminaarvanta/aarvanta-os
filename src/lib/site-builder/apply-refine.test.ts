import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyRefineHeuristics,
  applyStudioRefine,
  didSiteVisiblyChange,
} from "@/lib/site-builder/apply-refine";
import type { GeneratedSite } from "@/types/site-builder";

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
    navigation: [
      { label: "Home", slug: "home" },
      { label: "About", slug: "about" },
      { label: "Contact", slug: "contact" },
    ],
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
      {
        slug: "about",
        title: "About",
        blocks: [
          {
            id: "about1",
            type: "about_split",
            props: {
              title: "The story of Acme",
              body: "We help local families.",
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        blocks: [
          {
            id: "contact1",
            type: "contact",
            props: {
              title: "Talk to Acme",
              description: "We reply in two days.",
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
    assert.equal(next.pages[0]?.blocks[0]?.props.headline, "Old headline");
  });

  it("updates about-page copy without rewriting the home hero", () => {
    const next = applyRefineHeuristics(
      sampleSite(),
      'Change the About title to "Our clinic story"'
    );
    assert.equal(next.pages[1]?.blocks[0]?.props.title, "Our clinic story");
    assert.equal(next.pages[0]?.blocks[0]?.props.headline, "Old headline");
  });

  it("updates the footer", () => {
    const next = applyRefineHeuristics(
      sampleSite(),
      'Change the footer to "© 2026 Bright Smile Dental"'
    );
    assert.equal(next.footerNote, "© 2026 Bright Smile Dental");
  });

  it("replaces existing copy anywhere on the site", () => {
    const next = applyRefineHeuristics(
      sampleSite(),
      'Change "We help local families." to "Family dentistry in Manchester."'
    );
    assert.equal(
      next.pages[1]?.blocks[0]?.props.body,
      "Family dentistry in Manchester."
    );
  });

  it("updates contact description", () => {
    const next = applyRefineHeuristics(
      sampleSite(),
      'Change the contact description to "Call us on weekdays."'
    );
    assert.equal(
      next.pages[2]?.blocks[0]?.props.description,
      "Call us on weekdays."
    );
  });
});

describe("applyStudioRefine honesty", () => {
  it("does not bump version or claim a change when nothing matches", () => {
    const prior = sampleSite();
    const result = applyStudioRefine(
      prior,
      "Add a membership portal with SSO and custom dashboards"
    );
    assert.equal(result.changed, false);
    assert.equal(result.site.version, 1);
    assert.equal(didSiteVisiblyChange(prior, result.site), false);
    assert.match(result.hint ?? "", /did not change/i);
  });

  it("explains a missing page instead of silently editing home", () => {
    const result = applyStudioRefine(
      sampleSite(),
      'Change the pricing title to "Simple plans"'
    );
    assert.equal(result.changed, false);
    assert.match(result.hint ?? "", /no pricing page/i);
    assert.equal(result.site.pages[0]?.blocks[0]?.props.headline, "Old headline");
  });
});
