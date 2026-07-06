import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import {
  buildDemoActivityFeed,
  buildDemoTeamComments,
  buildDemoTeamNotes,
} from "@/lib/data/team-demo-seed";
import type { TeamRepository } from "@/lib/data/team-repository";

let notes = buildDemoTeamNotes();
let comments = buildDemoTeamComments();
let activity = buildDemoActivityFeed();

export const teamMemoryRepository: TeamRepository = {
  async listNotes(scope) {
    return notes
      .filter((n) => inCrmScope(n, scope))
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async createNote(input, scope) {
    const now = crmNow();
    const note = {
      ...scope,
      ...input,
      id: crmNewId("note"),
      pinned: input.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(note);
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
    return comments
      .filter(
        (c) => inCrmScope(c, scope) && (!noteId || c.noteId === noteId)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  },

  async createComment(input, scope) {
    const comment = {
      ...scope,
      ...input,
      id: crmNewId("comment"),
      createdAt: crmNow(),
    };
    comments.push(comment);
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
    if (input.mentionIds.length > 0) {
      await this.addActivity(
        {
          kind: "mention",
          title: `${input.authorName} mentioned ${input.mentionNames.join(", ")}`,
          description: input.body.slice(0, 120),
          actorId: input.authorId,
          actorName: input.authorName,
          entityType: input.entityType,
          entityId: input.entityId,
        },
        scope
      );
    }
    return comment;
  },

  async listActivity(scope, limit = 50) {
    return activity
      .filter((a) => inCrmScope(a, scope))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  },

  async addActivity(input, scope) {
    const item = {
      ...scope,
      ...input,
      id: crmNewId("act"),
      createdAt: crmNow(),
    };
    activity.unshift(item);
    return item;
  },
};

export function resetTeamMemory() {
  notes = buildDemoTeamNotes();
  comments = buildDemoTeamComments();
  activity = buildDemoActivityFeed();
}
