export type SearchResultKind =
  | "feature"
  | "contact"
  | "company"
  | "deal"
  | "project"
  | "document"
  | "conversation"
  | "workflow"
  | "proposal";

export type SearchResultGroup =
  | "Features"
  | "CRM"
  | "Projects"
  | "Knowledge"
  | "Inbox"
  | "Workflows"
  | "Proposals";

export interface GlobalSearchResult {
  id: string;
  kind: SearchResultKind;
  group: SearchResultGroup;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResult[];
}
