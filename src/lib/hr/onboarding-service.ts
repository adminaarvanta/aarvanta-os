import type {
  CeoCountersignItem,
  OnboardingCandidate,
  OnboardingDashboard,
  OnboardingStats,
} from "@/types/onboarding";

const DEMO_CANDIDATES: OnboardingCandidate[] = [
  {
    id: "onb_priya",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    role: "BDM",
    status: "awaiting_ceo",
    startDate: "2026-07-21",
    sentAt: "2026-07-10T09:00:00.000Z",
    openedAt: "2026-07-10T14:22:00.000Z",
    candidateSignedAt: "2026-07-12T11:05:00.000Z",
    submissionId: "sub_demo_priya",
    archivedFiles: [],
    source: "os",
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-12T11:05:00.000Z",
  },
  {
    id: "onb_james",
    name: "James Okonkwo",
    email: "james.okonkwo@example.com",
    role: "Sales Ex",
    status: "awaiting",
    startDate: "2026-07-28",
    sentAt: "2026-07-14T08:30:00.000Z",
    openedAt: "2026-07-14T16:10:00.000Z",
    submissionId: "sub_demo_james",
    archivedFiles: [],
    source: "os",
    createdAt: "2026-07-13T09:00:00.000Z",
    updatedAt: "2026-07-14T16:10:00.000Z",
  },
  {
    id: "onb_mei",
    name: "Mei Chen",
    email: "mei.chen@example.com",
    role: "Content Creator",
    status: "not_sent",
    startDate: "2026-08-04",
    archivedFiles: [],
    source: "os",
    createdAt: "2026-07-15T12:00:00.000Z",
    updatedAt: "2026-07-15T12:00:00.000Z",
  },
  {
    id: "onb_alex",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    role: "Digital Marketing",
    status: "completed",
    startDate: "2026-07-01",
    sentAt: "2026-06-20T10:00:00.000Z",
    openedAt: "2026-06-20T15:00:00.000Z",
    candidateSignedAt: "2026-06-22T09:00:00.000Z",
    completedAt: "2026-06-23T11:30:00.000Z",
    submissionId: "sub_demo_alex",
    archivedFiles: ["Offer_Letter_Alex_Rivera.pdf", "NDA_Alex_Rivera.pdf"],
    source: "os",
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-23T11:30:00.000Z",
  },
];

let store: OnboardingCandidate[] | null = null;

function getStore(): OnboardingCandidate[] {
  if (!store) store = structuredClone(DEMO_CANDIDATES);
  return store;
}

function computeStats(candidates: OnboardingCandidate[]): OnboardingStats {
  return {
    total: candidates.length,
    notSent: candidates.filter((c) => c.status === "not_sent").length,
    awaiting: candidates.filter(
      (c) => c.status === "awaiting" || c.status === "opened"
    ).length,
    awaitingCeo: candidates.filter((c) => c.status === "awaiting_ceo").length,
    completed: candidates.filter((c) => c.status === "completed").length,
    declined: candidates.filter((c) => c.status === "declined").length,
  };
}

function ceoQueueFrom(candidates: OnboardingCandidate[]): CeoCountersignItem[] {
  return candidates
    .filter((c) => c.status === "awaiting_ceo" && c.submissionId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      submissionId: c.submissionId!,
      candidateSignedAt: c.candidateSignedAt,
    }));
}

export async function getOnboardingDashboard(): Promise<OnboardingDashboard> {
  const candidates = getStore();
  return {
    stats: computeStats(candidates),
    candidates: structuredClone(candidates),
    ceoQueue: ceoQueueFrom(candidates),
    mode: "native",
  };
}

export async function createOnboardingCandidate(input: {
  name: string;
  email: string;
  role: string;
  startDate?: string;
  employeeId?: string;
  atsCandidateId?: string;
}): Promise<OnboardingCandidate> {
  const now = new Date().toISOString();
  const candidate: OnboardingCandidate = {
    id: `onb_${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role.trim(),
    status: "not_sent",
    startDate: input.startDate,
    archivedFiles: [],
    employeeId: input.employeeId,
    atsCandidateId: input.atsCandidateId,
    source: "os",
    createdAt: now,
    updatedAt: now,
  };
  getStore().unshift(candidate);
  return structuredClone(candidate);
}

export async function sendOnboardingPack(
  id: string
): Promise<OnboardingCandidate | null> {
  const candidates = getStore();
  const idx = candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const candidate = candidates[idx]!;
  const now = new Date().toISOString();
  const slug = candidate.name.replace(/\s+/g, "_");
  candidates[idx] = {
    ...candidate,
    status: "awaiting",
    sentAt: now,
    submissionId: candidate.submissionId ?? `sub_${crypto.randomUUID().slice(0, 8)}`,
    archivedFiles:
      candidate.archivedFiles.length > 0
        ? candidate.archivedFiles
        : [`offer_letter_${slug}.pdf`, `nda_${slug}.pdf`],
    updatedAt: now,
  };
  return structuredClone(candidates[idx]!);
}

export async function markCandidateSigned(
  id: string
): Promise<OnboardingCandidate | null> {
  const candidates = getStore();
  const idx = candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  candidates[idx] = {
    ...candidates[idx]!,
    status: "awaiting_ceo",
    candidateSignedAt: now,
    openedAt: candidates[idx]!.openedAt ?? now,
    updatedAt: now,
  };
  return structuredClone(candidates[idx]!);
}

export async function markCeoComplete(
  id: string
): Promise<OnboardingCandidate | null> {
  const candidates = getStore();
  const idx = candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const name = candidates[idx]!.name.replace(/\s+/g, "_");
  candidates[idx] = {
    ...candidates[idx]!,
    status: "completed",
    completedAt: now,
    updatedAt: now,
    archivedFiles:
      candidates[idx]!.archivedFiles.length > 0
        ? candidates[idx]!.archivedFiles
        : [`Offer_Letter_${name}.pdf`, `NDA_${name}.pdf`],
  };
  return structuredClone(candidates[idx]!);
}
