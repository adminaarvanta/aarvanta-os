import type { TenantScope } from "@/types/communication";

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageEmoji?: string;
};

export type GeneratedStorePage = TenantScope & {
  id: string;
  slug: string;
  brandName: string;
  tagline: string;
  description: string;
  logoDataUrl?: string;
  primaryColor: string;
  accentColor: string;
  products: StoreProduct[];
  heroCta: string;
  industryProfileId: string;
  launchSessionId?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
