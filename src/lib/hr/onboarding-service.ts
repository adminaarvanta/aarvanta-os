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
    ceoSigningLink: "https://sign.aarvanta.co/s/demo-ceo-priya",
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
    signingLink: "https://sign.aarvanta.co/s/demo-james",
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

function sidecarBaseUrl(): string | null {
  const url = process.env.ONBOARDING_SIDECAR_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

async function fetchSidecarDashboard(): Promise<OnboardingDashboard | null> {
  const base = sidecarBaseUrl();
  if (!base) return null;
  const secret = process.env.ONBOARDING_SIDECAR_SECRET;
  try {
    const res = await fetch(`${base}/api/candidates`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: OnboardingCandidate[];
      ceoQueue?: CeoCountersignItem[];
    };
    const candidates = data.candidates ?? [];
    return {
      stats: computeStats(candidates),
      candidates,
      ceoQueue: data.ceoQueue ?? [],
      mode: "sidecar",
      sidecarConfigured: true,
    };
  } catch {
    return null;
  }
}

export async function getOnboardingDashboard(): Promise<OnboardingDashboard> {
  const sidecar = await fetchSidecarDashboard();
  if (sidecar) return sidecar;

  const candidates = getStore();
  const ceoQueue: CeoCountersignItem[] = candidates
    .filter((c) => c.status === "awaiting_ceo" && c.submissionId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      submissionId: c.submissionId!,
      candidateSignedAt: c.candidateSignedAt,
      ceoSigningLink: c.ceoSigningLink,
    }));

  return {
    stats: computeStats(candidates),
    candidates: structuredClone(candidates),
    ceoQueue,
    mode: "demo",
    sidecarConfigured: Boolean(sidecarBaseUrl()),
  };
}

export async function createOnboardingCandidate(input: {
  name: string;
  email: string;
  role: string;
  startDate?: string;
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
  const base = sidecarBaseUrl();
  const candidates = getStore();
  const idx = candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const candidate = candidates[idx]!;

  if (base) {
    const secret = process.env.ONBOARDING_SIDECAR_SECRET;
    try {
      await fetch(`${base}/api/onboarding/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
          startDate: candidate.startDate,
        }),
      });
    } catch {
      // Fall through to demo status update so UI stays usable.
    }
  }

  const now = new Date().toISOString();
  candidates[idx] = {
    ...candidate,
    status: "awaiting",
    sentAt: now,
    submissionId: candidate.submissionId ?? `sub_${crypto.randomUUID().slice(0, 8)}`,
    signingLink:
      candidate.signingLink ??
      `https://sign.aarvanta.co/s/demo-${crypto.randomUUID().slice(0, 6)}`,
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
  candidates[idx] = {
    ...candidates[idx]!,
    status: "completed",
    completedAt: now,
    updatedAt: now,
    archivedFiles:
      candidates[idx]!.archivedFiles.length > 0
        ? candidates[idx]!.archivedFiles
        : [
            `Offer_Letter_${candidates[idx]!.name.replace(/\s+/g, "_")}.pdf`,
            `NDA_${candidates[idx]!.name.replace(/\s+/g, "_")}.pdf`,
          ],
  };
  return structuredClone(candidates[idx]!);
}
