/** Free image helpers: Unsplash API when keyed, else curated CDN IDs / picsum. */

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

function hashOffset(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Map category + keywords to a media bucket so toy shops don't get shoe stock photos.
 * The old ecommerce default led with Unsplash photo-1542291026 (red Nike sneaker).
 */
export function resolveMediaBucket(
  categoryKey: string,
  keywords: string[] = []
): string {
  const blob = `${categoryKey} ${keywords.join(" ")}`.toLowerCase();

  if (/(shoe|sneaker|footwear|boot)/.test(blob)) return "footwear";
  if (/(toy|wooden|kids|children|play|puzzle|plush|doll)/.test(blob)) return "toys";
  if (/(food|restaurant|cafe|bakery|coffee|kitchen|dining)/.test(blob)) return "food";
  if (/(fashion|apparel|clothing|dress|wear|boutique)/.test(blob)) return "fashion";
  if (/(beauty|skincare|cosmetic|makeup|spa)/.test(blob)) return "beauty";
  if (/(home|furniture|decor|interior|living)/.test(blob)) return "home";
  if (/(jewelry|jewellery|watch|accessory)/.test(blob)) return "jewelry";
  if (/(saas|software|dashboard|app|analytics|cloud)/.test(blob)) return "saas";
  if (/(health|clinic|medical|dental|care)/.test(blob)) return "healthcare";
  if (/(agency|studio|creative|branding)/.test(blob)) return "agency";
  if (/(portfolio|architect|design studio)/.test(blob)) return "portfolio";
  if (/(nonprofit|charity|community)/.test(blob)) return "nonprofit";
  if (/(event|conference|wedding)/.test(blob)) return "event";
  if (/(blog|writer|newsletter|media)/.test(blob)) return "blog";
  if (/(local|plumber|clean|repair|service)/.test(blob)) return "local_service";
  if (/(professional|consult|law|finance|account)/.test(blob)) return "professional";

  if (FALLBACK_IDS[categoryKey]) return categoryKey;
  return "default";
}

/** Curated Unsplash photo IDs used when the API key is absent. No sneaker lead image. */
const FALLBACK_IDS: Record<string, string[]> = {
  // Store interior / market — NOT footwear
  ecommerce: [
    "1441986300917-64674bd600d8",
    "1472851294608-734f5b1c2e3f",
    "1556742049-0cfed4f6a45d",
    "1523275335684-37898b6baf30",
  ],
  toys: [
    "1515488042361-ee00e0ddd4e4",
    "1566576912321-d58ddd7a6088",
    "1558060370-d644479cb6f7",
    "1596461404969-9ae70f2830c1",
    "1503454537195-1dcabb73ffb9",
  ],
  footwear: [
    "1542291026-7eec264c27ff",
    "1460353581641-37baddab0fa2",
    "1515955657353-e5ac0f0277c0",
  ],
  fashion: [
    "1483985988355-763728e1935b",
    "1445205170230-053b83016050",
    "1490481651871-ab68de25d43d",
  ],
  food: [
    "1414235077428-338989a2e8c0",
    "1517248135467-4c7edcad34c4",
    "1559339352-11d035aa65de",
    "1504674900247-0877df9cc836",
  ],
  beauty: [
    "1522335789203-aabd1fc54bc9",
    "1570172619644-dfd58eddb098",
    "1596462502278-27bfdc403348",
  ],
  home: [
    "1616486338812-3dadae4b4ace",
    "1586023492125-27b2c045efd7",
    "1493663284031-b7e3aefcae8e",
  ],
  jewelry: [
    "1515562141207-7a88fb7ce338",
    "1617038260897-41a1f14a8ea0",
    "1599643478518-a647e40cfe88",
  ],
  saas: [
    "1460925895917-afdab827c52f",
    "1551288049-bebda4e38f71",
    "1516321318423-f06f85e504b3",
  ],
  local_service: [
    "1581578731548-c64695cc6952",
    "1621905252507-b35492cc74b4",
    "1504328340386-5e0c4e4e0e0a",
  ],
  professional: [
    "1454165804606-c3d57bc86b40",
    "1521791136064-7986c2920216",
    "1556761175-b413da4baf72",
  ],
  restaurant: [
    "1517248135467-4c7edcad34c4",
    "1414235077428-338989a2e8c0",
    "1559339352-11d035aa65de",
  ],
  healthcare: [
    "1576091160399-112ba8d25d1d",
    "1631217868264-e5b90bb7e133",
    "1584982751601-97dcc096954c",
  ],
  agency: [
    "1552664730-d307ca884978",
    "1542744173-8e7e53415bb0",
    "1522071820081-009f0129c71c",
  ],
  portfolio: [
    "1497366216548-37526070297c",
    "1497366754035-f200968a6e72",
    "1503387762-592deb58ef4e",
  ],
  nonprofit: [
    "1488521787991-ed7bbaae773c",
    "1469571486292-0ba158845e0b",
    "1559027615-cd4628902d4a",
  ],
  blog: [
    "1499750310107-5fef28a66643",
    "1432821596592-e2c18b78144f",
    "1455390582262-044cdead277a",
  ],
  event: [
    "1540575467063-62b1d3cd0d0b",
    "1505373877931-df9b0c9fefd9",
    "1475721027785-f74eccf877e2",
  ],
  internal_tool_landing: [
    "1551434678-e076c223a692f",
    "1460925895917-afdab827c52f",
    "1553877522-43269d4ea984",
  ],
  default: [
    "1470071459604-3b5ec3a7fe05",
    "1506905925346-21bda4d32df4",
    "1441974231531-c6227db76b6e",
  ],
};

function unsplashCdn(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export async function fetchCategoryImages(
  categoryKey: string,
  keywords: string[],
  count = 8
): Promise<string[]> {
  const bucket = resolveMediaBucket(categoryKey, keywords);
  const seedKey = keywords.filter(Boolean).join(" ").trim() || bucket;
  const cacheKey = `${bucket}:${seedKey}:${count}`;
  const cached = unsplashCache.get(cacheKey);
  if (cached) return cached;

  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (key) {
    try {
      const query = encodeURIComponent(
        keywords.filter(Boolean).slice(0, 4).join(" ") || bucket
      );
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

  const ids = FALLBACK_IDS[bucket] ?? FALLBACK_IDS.default;
  const offset = hashOffset(seedKey) % Math.max(ids.length, 1);
  const urls = Array.from({ length: count }, (_, i) => {
    const id = ids[(offset + i) % ids.length];
    if (id && /^\d/.test(id)) return unsplashCdn(id);
    return picsum(`${seedKey}-${i}`);
  });
  unsplashCache.set(cacheKey, urls);
  return urls;
}

export function imageAt(urls: string[], index: number, seed: string): string {
  return urls[index % Math.max(urls.length, 1)] ?? picsum(seed);
}
