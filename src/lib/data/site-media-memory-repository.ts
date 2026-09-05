import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { SiteMediaRepository } from "@/lib/data/site-media-repository";
import { clientMediaPublicPath, toClientMediaRefs } from "@/lib/site-builder/apply-client-media";
import {
  SITE_MEDIA_MAX_BYTES,
  SITE_MEDIA_MAX_PER_JOB,
} from "@/lib/site-builder/media-constants";
import type { SiteClientMedia } from "@/types/site-builder";

type Stored = SiteClientMedia & { dataBase64: string } & {
  tenantId: string;
  workspaceId: string;
  companyId: string;
};

const records: Stored[] = [];

function toRef(record: Stored): SiteClientMedia {
  return toClientMediaRefs([record])[0]!;
}

export const siteMediaMemoryRepository: SiteMediaRepository = {
  async listByJob(jobId, scope) {
    return records
      .filter((item) => item.jobId === jobId && inCrmScope(item, scope))
      .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
      .map(toRef);
  },

  async getBlob(jobId, id) {
    const item = records.find((record) => record.jobId === jobId && record.id === id);
    return item
      ? {
          ...toRef(item),
          dataBase64: item.dataBase64,
        }
      : null;
  },

  async create(input, scope) {
    if (input.bytes.length > SITE_MEDIA_MAX_BYTES) {
      throw new Error(`Photo must be under ${Math.round(SITE_MEDIA_MAX_BYTES / 1024)}KB.`);
    }
    const existing = records.filter(
      (item) => item.jobId === input.jobId && inCrmScope(item, scope)
    );
    if (existing.length >= SITE_MEDIA_MAX_PER_JOB) {
      throw new Error(`You can upload up to ${SITE_MEDIA_MAX_PER_JOB} photos per site.`);
    }

    const id = crmNewId("media");
    const stored: Stored = {
      ...scope,
      id,
      jobId: input.jobId,
      name: input.name,
      mimeType: input.mimeType,
      role: input.role,
      caption: input.caption,
      url: clientMediaPublicPath(input.jobId, id),
      byteSize: input.bytes.length,
      uploadedAt: crmNow(),
      dataBase64: input.bytes.toString("base64"),
    };
    records.push(stored);
    return toRef(stored);
  },

  async update(jobId, id, scope, patch) {
    const item = records.find(
      (record) => record.jobId === jobId && record.id === id && inCrmScope(record, scope)
    );
    if (!item) return null;
    if (patch.role) item.role = patch.role;
    if (patch.caption !== undefined) {
      item.caption = patch.caption.trim() || undefined;
    }
    return toRef(item);
  },

  async remove(jobId, id, scope) {
    const idx = records.findIndex(
      (record) => record.jobId === jobId && record.id === id && inCrmScope(record, scope)
    );
    if (idx === -1) return false;
    records.splice(idx, 1);
    return true;
  },

  async removeByJob(jobId, scope) {
    let removed = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      const item = records[i]!;
      if (item.jobId === jobId && inCrmScope(item, scope)) {
        records.splice(i, 1);
        removed += 1;
      }
    }
    return removed;
  },
};
