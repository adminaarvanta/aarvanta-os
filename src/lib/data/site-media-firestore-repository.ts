import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { SiteMediaRepository } from "@/lib/data/site-media-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { clientMediaPublicPath, toClientMediaRefs } from "@/lib/site-builder/apply-client-media";
import {
  SITE_MEDIA_MAX_BYTES,
  SITE_MEDIA_MAX_PER_JOB,
} from "@/lib/site-builder/media-constants";
import type { SiteClientMedia } from "@/types/site-builder";

const COLLECTION = "site_build_media";

type Stored = SiteClientMedia & {
  tenantId: string;
  workspaceId: string;
  companyId: string;
  dataBase64: string;
};

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

function toRef(record: Stored): SiteClientMedia {
  return toClientMediaRefs([record])[0]!;
}

async function listStored(jobId: string): Promise<Stored[]> {
  const snap = await getDb().collection(COLLECTION).where("jobId", "==", jobId).get();
  return snap.docs.map((doc) => doc.data() as Stored);
}

export const siteMediaFirestoreRepository: SiteMediaRepository = {
  async listByJob(jobId, scope) {
    const items = await listStored(jobId);
    return items
      .filter((item) => inCrmScope(item, scope))
      .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
      .map(toRef);
  },

  async getBlob(jobId, id) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Stored;
    if (data.jobId !== jobId) return null;
    return {
      ...toRef(data),
      dataBase64: data.dataBase64,
    };
  },

  async create(input, scope) {
    if (input.bytes.length > SITE_MEDIA_MAX_BYTES) {
      throw new Error(`Photo must be under ${Math.round(SITE_MEDIA_MAX_BYTES / 1024)}KB.`);
    }
    const existing = (await listStored(input.jobId)).filter((item) =>
      inCrmScope(item, scope)
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
    await getDb().collection(COLLECTION).doc(id).set(stored);
    return toRef(stored);
  },

  async update(jobId, id, scope, patch) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Stored;
    if (data.jobId !== jobId || !inCrmScope(data, scope)) return null;
    const next: Stored = {
      ...data,
      role: patch.role ?? data.role,
      caption:
        patch.caption !== undefined ? patch.caption.trim() || undefined : data.caption,
    };
    await getDb().collection(COLLECTION).doc(id).set(next);
    return toRef(next);
  },

  async remove(jobId, id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return false;
    const data = snap.data() as Stored;
    if (data.jobId !== jobId || !inCrmScope(data, scope)) return false;
    await getDb().collection(COLLECTION).doc(id).delete();
    return true;
  },

  async removeByJob(jobId, scope) {
    const items = (await listStored(jobId)).filter((item) => inCrmScope(item, scope));
    const db = getDb();
    const batch = db.batch();
    for (const item of items) {
      batch.delete(db.collection(COLLECTION).doc(item.id));
    }
    if (items.length) await batch.commit();
    return items.length;
  },
};
