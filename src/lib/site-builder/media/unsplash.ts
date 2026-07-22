/** Free image helpers: Unsplash API when keyed, else picsum / DiceBear. */

const unsplashCache = new Map<string, string[]>();

export function isUnsplashConfigured(): boolean {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY?.trim());
}

function picsum(seed: string, w = 1600, h = 900): string {
  const s = encodeURIComponent(seed.replace(/\s+/g, "-").slice(0, 40));
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}

export function dicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

/** Curated Unsplash photo IDs used when the API key is absent. */
const FALLBACK_IDS: Record<string, string[]> = {
  ecommerce: ["1542291026-7eec264c27ff", "1441986300917-64674bd600d8", "1556742049-0cfed4f6a45d"],
  saas: ["1460925895917-afdab827c52f", "1551288049-bebda4e38f71", "1516321318423-f06f85e504b3"],
  local_service: ["1581578731548-c64695cc6952", "1504328340386-5e0c4e4e0e0a", "1621905252507-b35492cc74b4"],
  professional: ["1454165804606-c3d57bc86b40", "1521791136064-7986c2920216", "1556761175-b413da4baf72"],
  restaurant: ["1517248135467-4c7edcad34c4", "1414235077428-338989a2e8c0", "1559339352-11d035aa65de"],
  healthcare: ["1576091160399-112ba8d25d1d", "1631217868264-e5b90bb7e133", "1584982751601-97dcc096954c"],
  agency: ["1552664730-d307ca884978", "1542744173-8e7e53415bb0", "1522071820081-009f0129c71c"],
  portfolio: ["1497366216548-37526070297c", "1497366754035-f200968a6e72", "1503387762-592deb58ef4e"],
  nonprofit: ["1488521787991-ed7bbaae773c", "1469571486292-0ba158845e0b", "1559027615-cd4628902d4a"],
  blog: ["1499750310107-5fef28a66643", "1432821596592-e2c18b78144f", "1455390582262-044cdead277a"],
  event: ["1540575467063-62b1d3cd0d0b", "1505373877931-df9b0c9fefd9", "1475721027785-f74eccf877e2"],
  internal_tool_landing: [
    "1551434678-e076c223a692f",
    "1460925895917-afdab827c52f",
    "1553877522-43269d4ea984",
  ],
  default: ["1470071459604-3b5ec3a7fe05", "1469474968028-6171b2c0e0e0", "1506905925346-21bda4d32df4"],
};

function unsplashCdn(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export async function fetchCategoryImages(
  categoryKey: string,
  keywords: string[],
  count = 8
): Promise<string[]> {
  const cacheKey = `${categoryKey}:${keywords.join(",")}:${count}`;
  const cached = unsplashCache.get(cacheKey);
  if (cached) return cached;

  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (key) {
    try {
      const query = encodeURIComponent(keywords.slice(0, 3).join(" ") || categoryKey);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&orientation=landscape`,
        {
          headers: { Authorization: `Client-ID ${key}` },
          next: { revalidate: 3600 },
        }
      );
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ urls?: { regular?: string; full?: string } }>;
        };
        const urls = (data.results ?? [])
          .map((r) => r.urls?.regular || r.urls?.full)
          .filter((u): u is string => Boolean(u));
        if (urls.length > 0) {
          unsplashCache.set(cacheKey, urls);
          return urls;
        }
      }
    } catch (err) {
      console.warn("[media] Unsplash search failed", err);
    }
  }

  const ids = FALLBACK_IDS[categoryKey] ?? FALLBACK_IDS.default;
  const urls = Array.from({ length: count }, (_, i) => {
    const id = ids[i % ids.length];
    if (id && /^\d/.test(id)) return unsplashCdn(id);
    return picsum(`${categoryKey}-${keywords[0] ?? "site"}-${i}`);
  });
  unsplashCache.set(cacheKey, urls);
  return urls;
}

export function imageAt(urls: string[], index: number, seed: string): string {
  return urls[index % Math.max(urls.length, 1)] ?? picsum(seed);
}
