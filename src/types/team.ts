import type { TenantScope } from "@/types/communication";

export type TeamEntityType =
  | "contact"
  | "deal"
  | "project"
  | "project_task"
  | "general";

export interface TeamNote extends TenantScope {
  id: string;
  entityType: TeamEntityType;
  entityId?: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  mentionIds: string[];
  mentionNames: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamComment extends TenantScope {
  id: string;
  entityType: TeamEntityType;
  entityId?: string;
  noteId?: string;
  body: string;
  authorId: string;
  authorName: string;
  mentionIds: string[];
  mentionNames: string[];
  createdAt: string;
}

export type ActivityKind =
  | "note_created"
  | "comment_added"
  | "mention"
  | "task_completed"
  | "deal_updated"
  | "agent_run"
  | "member_joined";

export interface ActivityFeedItem extends TenantScope {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  actorId: string;
  actorName: string;
  entityType?: TeamEntityType;
  entityId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

/** Internal company channels — Layer 8 (demo scaffold). */
export interface TeamChannel extends TenantScope {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}
