export type OnboardingStatus =
  | "not_sent"
  | "awaiting"
  | "opened"
  | "awaiting_ceo"
  | "completed"
  | "declined";

export type OnboardingRole =
  | "BDM"
  | "Sales Ex"
  | "Content Creator"
  | "Digital Marketing"
  | string;

export interface OnboardingCandidate {
  id: string;
  name: string;
  email: string;
  role: OnboardingRole;
  status: OnboardingStatus;
  startDate?: string;
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  candidateSignedAt?: string;
  submissionId?: string;
  signingLink?: string;
  ceoSigningLink?: string;
  archivedFiles: string[];
  source: "os" | "sidecar";
  createdAt: string;
  updatedAt: string;
}

export interface CeoCountersignItem {
  id: string;
  name: string;
  email: string;
  role: OnboardingRole;
  submissionId: string;
  candidateSignedAt?: string;
  ceoSigningLink?: string;
}

export interface OnboardingStats {
  total: number;
  notSent: number;
  awaiting: number;
  awaitingCeo: number;
  completed: number;
  declined: number;
}

export interface OnboardingDashboard {
  stats: OnboardingStats;
  candidates: OnboardingCandidate[];
  ceoQueue: CeoCountersignItem[];
  mode: "demo" | "sidecar";
  sidecarConfigured: boolean;
}
