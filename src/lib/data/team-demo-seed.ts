import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { DEMO_USER_ID } from "@/lib/data/tenant-demo-seed";
import { crmNow } from "@/lib/data/crm-helpers";
import type { ActivityFeedItem, TeamComment, TeamNote } from "@/types/team";

const now = crmNow();

export function buildDemoTeamNotes(): TeamNote[] {
  return [
    {
      ...DEMO_TENANT,
      id: "note_kickoff",
      entityType: "project",
      entityId: "proj_meridian_onboard",
      title: "Meridian onboarding kickoff",
      body: "Kickoff call went well. @Sarah Chen to send SOW by Friday. @John owns technical discovery.",
      authorId: DEMO_USER_ID,
      authorName: "Pavan",
      mentionIds: ["user_sarah", "user_john"],
      mentionNames: ["Sarah Chen", "John"],
      pinned: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "note_northstar",
      entityType: "deal",
      entityId: "deal_northstar_upsell",
      title: "Northstar pricing discussion",
      body: "Client prefers annual billing. @Sarah Chen — align proposal with Growth tier pricing.",
      authorId: "user_sarah",
      authorName: "Sarah Chen",
      mentionIds: ["user_sarah"],
      mentionNames: ["Sarah Chen"],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "note_hr",
      entityType: "general",
      title: "Q2 hiring plan",
      body: "Two roles open: Senior AE and Customer Success. HR agent drafted JDs in Knowledge Hub.",
      authorId: DEMO_USER_ID,
      authorName: "Pavan",
      mentionIds: [],
      mentionNames: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildDemoTeamComments(): TeamComment[] {
  return [
    {
      ...DEMO_TENANT,
      id: "comment_1",
      entityType: "project",
      entityId: "proj_meridian_onboard",
      noteId: "note_kickoff",
      body: "SOW draft is in Google Drive — @Pavan please review before send.",
      authorId: "user_sarah",
      authorName: "Sarah Chen",
      mentionIds: [DEMO_USER_ID],
      mentionNames: ["Pavan"],
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "comment_2",
      entityType: "deal",
      entityId: "deal_northstar_upsell",
      noteId: "note_northstar",
      body: "Updated proposal sent. Waiting on legal review from their side.",
      authorId: "user_john",
      authorName: "John",
      mentionIds: [],
      mentionNames: [],
      createdAt: now,
    },
  ];
}

export function buildDemoActivityFeed(): ActivityFeedItem[] {
  return [
    {
      ...DEMO_TENANT,
      id: "act_1",
      kind: "note_created",
      title: "Pavan pinned a note",
      description: "Meridian onboarding kickoff",
      actorId: DEMO_USER_ID,
      actorName: "Pavan",
      entityType: "project",
      entityId: "proj_meridian_onboard",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "act_2",
      kind: "mention",
      title: "Sarah Chen mentioned you",
      description: "SOW draft is in Google Drive — @Pavan please review",
      actorId: "user_sarah",
      actorName: "Sarah Chen",
      entityType: "project",
      entityId: "proj_meridian_onboard",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "act_3",
      kind: "agent_run",
      title: "AI Sales Manager completed pipeline review",
      description: "3 hot leads flagged for follow-up",
      actorId: "agent_sales_manager",
      actorName: "AI Sales Manager",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "act_4",
      kind: "deal_updated",
      title: "Northstar Digital deal moved to Proposal",
      description: "£24,000 · 65% probability",
      actorId: "user_sarah",
      actorName: "Sarah Chen",
      entityType: "deal",
      entityId: "deal_northstar_upsell",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "act_5",
      kind: "task_completed",
      title: "John completed onboarding checklist review",
      actorId: "user_john",
      actorName: "John",
      entityType: "project_task",
      entityId: "ptask_1",
      createdAt: now,
    },
  ];
}
