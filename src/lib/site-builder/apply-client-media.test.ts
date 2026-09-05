import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyClientMediaToSite,
  countClientMediaOnSite,
  isClientMediaUrl,
} from "@/lib/site-builder/apply-client-media";
import type { GeneratedSite, SiteClientMedia } from "@/types/site-builder";

function media(
  partial: Pick<SiteClientMedia, "id" | "role"> & Partial<SiteClientMedia>
): SiteClientMedia {
  return {
    jobId: "build_1",
    name: `${partial.id}.jpg`,
    mimeType: "image/jpeg",
    url: `/api/build/build_1/media/${partial.id}`,
    byteSize: 1200,
    uploadedAt: "2026-09-05T00:00:00.000Z",
    ...partial,
  };
}

function siteFixture(): GeneratedSite {
  return {
    siteName: "North of the Tyne Laser",
    slug: "north-of-the-tyne-laser",
    theme: {
      presetId: "minimal_light",
      primaryColor: "#111827",
      accentColor: "#B8965D",
      backgroundColor: "#FFFFFF",
      fontStyle: "sans",
      styleNotes: "",
    },
    navigation: [],
    pages: [
      {
        slug: "home",
        title: "Home",
        blocks: [
          {
            id: "hero",
            type: "hero",
            props: { imageUrl: "https://images.unsplash.com/stock-hero" },
          },
          {
            id: "gallery",
            type: "gallery",
            props: {
              title: "Recent work",
              items: [
                { caption: "Piece 1", imageUrl: "https://images.unsplash.com/g1" },
                { caption: "Piece 2", imageUrl: "https://images.unsplash.com/g2" },
                { caption: "Piece 3", imageUrl: "https://images.unsplash.com/g3" },
              ],
            },
          },
          {
            id: "about",
            type: "about_split",
            props: { imageUrl: "https://images.unsplash.com/about" },
          },
        ],
      },
    ],
    generatedAt: "2026-09-05T00:00:00.000Z",
  };
}

describe("applyClientMediaToSite", () => {
  it("recognizes client media URLs", () => {
    assert.equal(isClientMediaUrl("/api/build/build_1/media/media_abc"), true);
    assert.equal(isClientMediaUrl("https://images.unsplash.com/photo"), false);
  });

  it("places role-matched photos and keeps stock on unused slots", () => {
    const next = applyClientMediaToSite(siteFixture(), [
      media({ id: "m_hero", role: "hero" }),
      media({ id: "m_g1", role: "gallery", caption: "Infinity plaque" }),
    ]);

    const hero = next.pages[0]!.blocks[0]!.props;
    const gallery = next.pages[0]!.blocks[1]!.props.items as Array<
      Record<string, unknown>
    >;
    const about = next.pages[0]!.blocks[2]!.props;

    assert.equal(hero.imageUrl, "/api/build/build_1/media/m_hero");
    assert.equal(hero.stockImageUrl, "https://images.unsplash.com/stock-hero");
    assert.equal(gallery[0]!.imageUrl, "/api/build/build_1/media/m_g1");
    assert.equal(gallery[0]!.caption, "Infinity plaque");
    assert.equal(gallery[1]!.imageUrl, "https://images.unsplash.com/g2");
    assert.equal(about.imageUrl, "https://images.unsplash.com/about");
    assert.equal(countClientMediaOnSite(next), 2);
  });

  it("spills leftover photos into remaining slots without inventing images", () => {
    const next = applyClientMediaToSite(siteFixture(), [
      media({ id: "m1", role: "general" }),
      media({ id: "m2", role: "general" }),
      media({ id: "m3", role: "general" }),
    ]);
    const hero = next.pages[0]!.blocks[0]!.props;
    const gallery = next.pages[0]!.blocks[1]!.props.items as Array<
      Record<string, unknown>
    >;
    assert.equal(hero.imageUrl, "/api/build/build_1/media/m1");
    assert.equal(gallery[0]!.imageUrl, "/api/build/build_1/media/m2");
    assert.equal(gallery[1]!.imageUrl, "/api/build/build_1/media/m3");
    assert.equal(gallery[2]!.imageUrl, "https://images.unsplash.com/g3");
  });

  it("restores stock when a client photo is removed", () => {
    const withPhoto = applyClientMediaToSite(siteFixture(), [
      media({ id: "m_hero", role: "hero" }),
    ]);
    const restored = applyClientMediaToSite(withPhoto, []);
    assert.equal(
      restored.pages[0]!.blocks[0]!.props.imageUrl,
      "https://images.unsplash.com/stock-hero"
    );
    assert.equal(countClientMediaOnSite(restored), 0);
  });
});
