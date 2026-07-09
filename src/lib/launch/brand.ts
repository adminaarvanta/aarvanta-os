export function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "business";
}

export function buildStoreSlug(brandName: string, workspaceId: string): string {
  const base = slugifyBrand(brandName);
  const suffix = workspaceId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
  return `${base}-${suffix}`;
}

export function suggestDomains(brandName: string, countryBase: string): Array<{
  domain: string;
  tld: string;
  available: boolean;
  note: string;
}> {
  const slug = slugifyBrand(brandName);
  const tlds =
    countryBase.toUpperCase() === "UK" || countryBase.toUpperCase() === "GB"
      ? [".co.uk", ".com", ".shop", ".store"]
      : [".com", ".co", ".shop"];

  return tlds.map((tld, index) => ({
    domain: `${slug}${tld}`,
    tld,
    available: index < 2,
    note:
      index < 2
        ? "Recommended — available for registration (verify with registrar)"
        : "Alternative — check availability",
  }));
}

export function generateLogoDataUrl(brandName: string, primaryColor: string): string {
  const initials = brandName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="${primaryColor}"/>
  <text x="64" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="#040608">${initials}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function pickBrandColors(industryProfileId: string): {
  primary: string;
  accent: string;
} {
  const palettes: Record<string, { primary: string; accent: string }> = {
    retail_ecommerce: { primary: "#B8965D", accent: "#FFFFFF" },
    professional_services: { primary: "#1A2B48", accent: "#FFFFFF" },
    restaurant_hospitality: { primary: "#C45C3E", accent: "#FFFFFF" },
    healthcare: { primary: "#2E8B8B", accent: "#E0F4F4" },
    manufacturing: { primary: "#6B7280", accent: "#FFFFFF" },
    construction: { primary: "#A88952", accent: "#FFFFFF" },
  };
  return palettes[industryProfileId] ?? { primary: "#1A2B48", accent: "#B8965D" };
}

export function buildTagline(businessIdea: string, industryLabel: string): string {
  const short = businessIdea.trim().slice(0, 80);
  if (short.length < 40) return `${industryLabel} — crafted for you`;
  return short.charAt(0).toUpperCase() + short.slice(1);
}
