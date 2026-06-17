import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type {
  CreateCommentInput,
  CreateNoteInput,
  TeamRepository,
} from "@/lib/data/team-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { ActivityFeedItem, TeamComment, TeamNote } from "@/types/team";

const NOTES = "team_notes";
const COMMENTS = "team_comments";
const ACTIVITY = "team_activity";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped<T extends TenantScope>(collection: string, scope: TenantScope) {
  const snap = await getDb()
    .collection(collection)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as T);
}

export const teamFirestoreRepository: TeamRepository = {
  async listNotes(scope) {
    const items = await listScoped<TeamNote>(NOTES, scope);
    return items.sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async createNote(input: CreateNoteInput, scope) {
    const now = crmNow();
    const note: TeamNote = {
      ...scope,
      ...input,
      id: crmNewId("note"),
      pinned: input.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(NOTES).doc(note.id).set(note);
    await this.addActivity(
      {
        kind: "note_created",
        title: `${input.authorName} added a note`,
        description: input.title,
        actorId: input.authorId,
        actorName: input.authorName,
        entityType: input.entityType,
        entityId: input.entityId,
      },
      scope
    );
    return note;
  },

  async listComments(scope, noteId) {
    const items = await listScoped<TeamComment>(COMMENTS, scope);
    return items
      .filter((c) => !noteId || c.noteId === noteId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  },

  async createComment(input: CreateCommentInput, scope) {
    const comment: TeamComment = {
      ...scope,
      ...input,
      id: crmNewId("comment"),
      createdAt: crmNow(),
    };
    await getDb().collection(COMMENTS).doc(comment.id).set(comment);
    await this.addActivity(
      {
        kind: "comment_added",
        title: `${input.authorName} commented`,
        description: input.body.slice(0, 120),
        actorId: input.authorId,
        actorName: input.authorName,
        entityType: input.entityType,
        entityId: input.entityId,
      },
      scope
    );
    return comment;
  },

  async listActivity(scope, limit = 50) {
    const items = await listScoped<ActivityFeedItem>(ACTIVITY, scope);
    return items
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  },

  async addActivity(input, scope) {
    const item: ActivityFeedItem = {
      ...scope,
      ...input,
      id: crmNewId("act"),
      createdAt: crmNow(),
    };
    await getDb().collection(ACTIVITY).doc(item.id).set(item);
    return item;
  },
};
