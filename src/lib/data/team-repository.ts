import type { TenantScope } from "@/types/communication";
import type {
  ActivityFeedItem,
  TeamComment,
  TeamEntityType,
  TeamNote,
} from "@/types/team";

export type CreateNoteInput = {
  entityType: TeamEntityType;
  entityId?: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  mentionIds: string[];
  mentionNames: string[];
  pinned?: boolean;
};

export type CreateCommentInput = {
  entityType: TeamEntityType;
  entityId?: string;
  noteId?: string;
  body: string;
  authorId: string;
  authorName: string;
  mentionIds: string[];
  mentionNames: string[];
};

export interface TeamRepository {
  listNotes(scope: TenantScope): Promise<TeamNote[]>;
  createNote(input: CreateNoteInput, scope: TenantScope): Promise<TeamNote>;
  listComments(scope: TenantScope, noteId?: string): Promise<TeamComment[]>;
  createComment(input: CreateCommentInput, scope: TenantScope): Promise<TeamComment>;
  listActivity(scope: TenantScope, limit?: number): Promise<ActivityFeedItem[]>;
  addActivity(
    input: Omit<ActivityFeedItem, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<ActivityFeedItem>;
}
