import type { TenantScope } from "@/types/communication";
import type { SiteClientMedia, SiteMediaRole } from "@/types/site-builder";

export type SiteMediaBlob = SiteClientMedia & {
  dataBase64: string;
};

export type CreateSiteMediaInput = {
  jobId: string;
  name: string;
  mimeType: string;
  role: SiteMediaRole;
  caption?: string;
  bytes: Buffer;
};

export type SiteMediaRepository = {
  listByJob(jobId: string, scope: TenantScope): Promise<SiteClientMedia[]>;
  getBlob(jobId: string, id: string): Promise<SiteMediaBlob | null>;
  create(input: CreateSiteMediaInput, scope: TenantScope): Promise<SiteClientMedia>;
  update(
    jobId: string,
    id: string,
    scope: TenantScope,
    patch: { role?: SiteMediaRole; caption?: string }
  ): Promise<SiteClientMedia | null>;
  remove(jobId: string, id: string, scope: TenantScope): Promise<boolean>;
  removeByJob(jobId: string, scope: TenantScope): Promise<number>;
};
