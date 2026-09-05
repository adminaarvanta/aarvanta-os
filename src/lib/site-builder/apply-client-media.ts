import type {
  GeneratedSite,
  SiteAssetRef,
  SiteBlock,
  SiteClientMedia,
  SiteMediaRole,
} from "@/types/site-builder";

export function clientMediaPublicPath(jobId: string, assetId: string): string {
  return `/api/build/${encodeURIComponent(jobId)}/media/${encodeURIComponent(assetId)}`;
}

export function isClientMediaUrl(url: unknown): boolean {
  return typeof url === "string" && /\/api\/build\/[^/]+\/media\/[^/?#]+/.test(url);
}

type MutableRecord = Record<string, unknown>;

type ImageSlot = {
  kind: Exclude<SiteMediaRole, "general">;
  target: MutableRecord;
  field: string;
  captionKey?: "caption" | "title";
};

const ROLE_PRIORITY: Array<Exclude<SiteMediaRole, "general">> = [
  "hero",
  "gallery",
  "portfolio",
  "about",
  "product",
];

function asRecord(value: unknown): MutableRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MutableRecord)
    : null;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function stockFieldFor(field: string): string {
  return field === "imageUrl" ? "stockImageUrl" : `${field}Stock`;
}

function idFieldFor(field: string): string {
  return field === "imageUrl" ? "clientMediaId" : `${field}ClientMediaId`;
}

function assignImage(
  target: MutableRecord,
  field: string,
  client: SiteClientMedia | null
): void {
  const current = target[field];
  const stockField = stockFieldFor(field);
  const idField = idFieldFor(field);

  if (
    typeof current === "string" &&
    current &&
    !isClientMediaUrl(current) &&
    typeof target[stockField] !== "string"
  ) {
    target[stockField] = current;
  }

  if (client) {
    target[field] = client.url;
    target[idField] = client.id;
    return;
  }

  if (typeof target[stockField] === "string") {
    target[field] = target[stockField];
  }
  delete target[idField];
}

function collectSlots(block: SiteBlock): ImageSlot[] {
  const type = String(block.type);
  const props = block.props as MutableRecord;
  const slots: ImageSlot[] = [];

  if (type === "hero") {
    slots.push({ kind: "hero", target: props, field: "imageUrl" });
    if ("supportImageUrl" in props) {
      slots.push({ kind: "hero", target: props, field: "supportImageUrl" });
    }
  }

  if (type === "cta_banner" && typeof props.imageUrl === "string") {
    slots.push({ kind: "hero", target: props, field: "imageUrl" });
  }

  if (type === "about_split") {
    slots.push({ kind: "about", target: props, field: "imageUrl" });
  }

  if (type === "gallery" && Array.isArray(props.items)) {
    for (const item of props.items) {
      const rec = asRecord(item);
      if (rec) {
        slots.push({
          kind: "gallery",
          target: rec,
          field: "imageUrl",
          captionKey: "caption",
        });
      }
    }
  }

  if (type === "portfolio_grid" && Array.isArray(props.items)) {
    for (const item of props.items) {
      const rec = asRecord(item);
      if (rec) {
        slots.push({
          kind: "portfolio",
          target: rec,
          field: "imageUrl",
          captionKey: "title",
        });
      }
    }
  }

  if (type === "products" && Array.isArray(props.products)) {
    for (const product of props.products) {
      const rec = asRecord(product);
      if (rec) {
        slots.push({ kind: "product", target: rec, field: "imageUrl" });
      }
    }
  }

  return slots;
}

function collectSiteSlots(site: GeneratedSite): ImageSlot[] {
  const slots: ImageSlot[] = [];
  for (const page of site.pages) {
    for (const block of page.blocks) {
      slots.push(...collectSlots(block));
    }
  }
  return slots;
}

/**
 * Overlay client-owned photos onto a generated site.
 * Stock URLs are kept as fallbacks on each slot; we never invent pictures of the work.
 */
export function applyClientMediaToSite(
  site: GeneratedSite,
  media: SiteClientMedia[]
): GeneratedSite {
  const pages = site.pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => ({
      ...block,
      props: cloneJson(block.props ?? {}),
    })),
  }));

  const nextSite: GeneratedSite = { ...site, pages };
  const slots = collectSiteSlots(nextSite);
  const mediaIds = new Set(media.map((item) => item.id));

  for (const slot of slots) {
    const currentId = slot.target[idFieldFor(slot.field)];
    if (typeof currentId === "string" && !mediaIds.has(currentId)) {
      assignImage(slot.target, slot.field, null);
    }
  }

  const queues: Record<SiteMediaRole, SiteClientMedia[]> = {
    hero: [],
    gallery: [],
    portfolio: [],
    about: [],
    product: [],
    general: [],
  };
  for (const item of media) {
    const role = queues[item.role] ? item.role : "general";
    queues[role].push(item);
  }

  const used = new Set<ImageSlot>();
  const place = (slot: ImageSlot, item: SiteClientMedia) => {
    assignImage(slot.target, slot.field, item);
    if (item.caption?.trim() && slot.captionKey) {
      slot.target[slot.captionKey] = item.caption.trim();
    }
    used.add(slot);
  };

  for (const slot of slots) {
    const item = queues[slot.kind].shift();
    if (item) place(slot, item);
  }

  const leftover = ROLE_PRIORITY.flatMap((role) => queues[role]).concat(queues.general);
  const remaining = slots
    .filter((slot) => !used.has(slot))
    .sort((a, b) => ROLE_PRIORITY.indexOf(a.kind) - ROLE_PRIORITY.indexOf(b.kind));

  for (const slot of remaining) {
    const item = leftover.shift();
    if (!item) break;
    place(slot, item);
  }

  const clientAssets: SiteAssetRef[] = media.map((item) => ({
    id: item.id,
    kind: "image",
    url: item.url,
    alt: item.caption || item.name,
  }));

  return {
    ...nextSite,
    assets: [
      ...(site.assets ?? []).filter(
        (asset) => asset.kind === "logo" || !isClientMediaUrl(asset.url)
      ),
      ...clientAssets,
    ],
  };
}

export function countClientMediaOnSite(site: GeneratedSite | null | undefined): number {
  if (!site) return 0;
  let count = 0;
  for (const slot of collectSiteSlots(site)) {
    if (isClientMediaUrl(slot.target[slot.field])) count += 1;
  }
  return count;
}

export function toClientMediaRefs(items: SiteClientMedia[]): SiteClientMedia[] {
  return items.map((item) => ({
    id: item.id,
    jobId: item.jobId,
    name: item.name,
    mimeType: item.mimeType,
    role: item.role,
    caption: item.caption,
    url: item.url,
    byteSize: item.byteSize,
    uploadedAt: item.uploadedAt,
  }));
}
