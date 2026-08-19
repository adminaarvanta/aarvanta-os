"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_ROOT_EMAIL } from "@/lib/affiliate/constants";
import type { Affiliate, AffiliateRole, AffiliateTreeNode } from "@/types/affiliate";

export type TreeAffiliate = Affiliate & {
  needsPasswordSetup?: boolean;
  role?: AffiliateRole;
};

const AVATAR_TONES = [
  { bg: "bg-sky-100 dark:bg-sky-500/20", fg: "text-sky-800 dark:text-sky-200" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/20", fg: "text-emerald-800 dark:text-emerald-200" },
  { bg: "bg-violet-100 dark:bg-violet-500/20", fg: "text-violet-800 dark:text-violet-200" },
  { bg: "bg-amber-100 dark:bg-amber-500/20", fg: "text-amber-900 dark:text-amber-200" },
  { bg: "bg-rose-100 dark:bg-rose-500/20", fg: "text-rose-800 dark:text-rose-200" },
  { bg: "bg-teal-100 dark:bg-teal-500/20", fg: "text-teal-800 dark:text-teal-200" },
  { bg: "bg-indigo-100 dark:bg-indigo-500/20", fg: "text-indigo-800 dark:text-indigo-200" },
  { bg: "bg-orange-100 dark:bg-orange-500/20", fg: "text-orange-800 dark:text-orange-200" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function avatarTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

function hierarchyLabel(affiliate: TreeAffiliate): string {
  if (affiliate.profile.email.toLowerCase() === PLATFORM_ROOT_EMAIL) {
    return "Owner";
  }
  if (affiliate.source === "internal") return "Team";
  if ((affiliate.role ?? "partner") === "regional_manager") {
    return "Regional manager";
  }
  return "Partner";
}

function statusBadgeClass(status: Affiliate["status"]): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-gold/20 dark:text-gold";
    case "suspended":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-surface-muted dark:text-muted";
  }
}

function shortCode(code: string): string {
  if (code.length <= 12) return code;
  return `${code.slice(0, 10)}…`;
}

function nodeMatches(affiliate: Affiliate, query: string): boolean {
  if (!query) return true;
  const hay = [
    affiliate.profile.name,
    affiliate.profile.email,
    affiliate.referralCode,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function collectVisibleIds(
  nodes: AffiliateTreeNode[],
  query: string
): Set<string> {
  const ids = new Set<string>();
  if (!query) return ids;

  function walk(node: AffiliateTreeNode, ancestors: string[]): boolean {
    const id = node.affiliate.id;
    const self = nodeMatches(node.affiliate, query);
    let childHit = false;
    for (const child of node.children) {
      if (walk(child, [...ancestors, id])) childHit = true;
    }
    if (self || childHit) {
      ids.add(id);
      for (const ancestor of ancestors) ids.add(ancestor);
      return true;
    }
    return false;
  }

  for (const node of nodes) walk(node, []);
  return ids;
}

function collectAllIds(nodes: AffiliateTreeNode[]): string[] {
  const ids: string[] = [];
  function walk(node: AffiliateTreeNode) {
    ids.push(node.affiliate.id);
    for (const child of node.children) walk(child);
  }
  for (const node of nodes) walk(node);
  return ids;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

function ConnectorDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 rounded-full border border-[#c5ced8] bg-white dark:border-border dark:bg-surface-elevated ${className ?? ""}`}
    />
  );
}

export function PersonCard({
  affiliate,
  selected,
  reportCount,
  dimmed,
  expanded,
  onSelect,
  onToggleReports,
}: {
  affiliate: TreeAffiliate;
  selected: boolean;
  reportCount: number;
  dimmed?: boolean;
  expanded?: boolean;
  onSelect: (id: string) => void;
  onToggleReports?: () => void;
}) {
  const label = hierarchyLabel(affiliate);
  const tone = avatarTone(affiliate.profile.email || affiliate.id);

  return (
    <div
      className={`flex w-[280px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border bg-white px-3.5 py-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition dark:bg-surface ${
        selected
          ? "border-gold ring-2 ring-gold/30"
          : "border-[#e6ebf1] hover:border-[#c5ced8] dark:border-border dark:hover:border-gold/40"
      } ${dimmed ? "opacity-35" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSelect(affiliate.id)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span
          className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone.bg} ${tone.fg}`}
          aria-hidden
        >
          {initials(affiliate.profile.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">
              {affiliate.profile.name}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(affiliate.status)}`}
            >
              {affiliate.status}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-muted">
            {label} · {shortCode(affiliate.referralCode)}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-400 dark:text-dim">
            {affiliate.profile.email}
            {affiliate.needsPasswordSetup ? " · awaiting password" : ""}
          </span>
        </span>
      </button>
      {reportCount > 0 ? (
        onToggleReports ? (
          <button
            type="button"
            onClick={onToggleReports}
            className="mt-1.5 ml-[60px] inline-flex items-center gap-1 self-start text-[11px] text-slate-500 hover:text-slate-700 dark:text-muted dark:hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse reports" : "Expand reports"}
          >
            <Users className="h-3 w-3" aria-hidden />
            {reportCount} report{reportCount === 1 ? "" : "s"}
          </button>
        ) : (
          <span className="mt-1.5 ml-[60px] inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-muted">
            <Users className="h-3 w-3" aria-hidden />
            {reportCount} report{reportCount === 1 ? "" : "s"}
          </span>
        )
      ) : null}
    </div>
  );
}

function OrgBranch({
  node,
  depth,
  index,
  siblingCount,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  visibleIds,
  query,
}: {
  node: AffiliateTreeNode;
  depth: number;
  index: number;
  siblingCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string, defaultOpen: boolean) => void;
  visibleIds: Set<string>;
  query: string;
}) {
  const a = node.affiliate as TreeAffiliate;
  const hasChildren = node.children.length > 0;
  const defaultOpen = depth < 2;
  const isOpen = query
    ? visibleIds.has(a.id) &&
      node.children.some((c) => visibleIds.has(c.affiliate.id))
    : a.id in expanded
      ? expanded[a.id]
      : defaultOpen;
  const dimmed = Boolean(query) && !visibleIds.has(a.id);
  const isFirst = index === 0;
  const isLast = index === siblingCount - 1;
  const showBar = depth > 0 && siblingCount > 1;

  return (
    <li className="relative flex flex-col items-center px-4">
      {depth > 0 ? (
        <div className="relative h-8 w-full">
          {showBar ? (
            <span
              aria-hidden
              className={`absolute top-0 h-px bg-[#c5ced8] dark:bg-border ${
                isFirst
                  ? "left-1/2 right-0"
                  : isLast
                    ? "left-0 right-1/2"
                    : "left-0 right-0"
              }`}
            />
          ) : null}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-[#c5ced8] dark:bg-border"
          />
          <ConnectorDot className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
        </div>
      ) : null}

      <PersonCard
        affiliate={a}
        selected={selectedId === a.id}
        reportCount={node.children.length}
        dimmed={dimmed}
        expanded={isOpen}
        onSelect={onSelect}
        onToggleReports={
          hasChildren ? () => onToggle(a.id, defaultOpen) : undefined
        }
      />

      {hasChildren && isOpen ? (
        <>
          <div className="relative h-8 w-px bg-[#c5ced8] dark:bg-border">
            <ConnectorDot className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
            <ConnectorDot className="left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2" />
          </div>
          <ul className="flex items-start justify-center">
            {node.children.map((child, i) => (
              <OrgBranch
                key={child.affiliate.id}
                node={child}
                depth={depth + 1}
                index={i}
                siblingCount={node.children.length}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
                visibleIds={visibleIds}
                query={query}
              />
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

function ListBranch({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  visibleIds,
  query,
}: {
  node: AffiliateTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string, defaultOpen: boolean) => void;
  visibleIds: Set<string>;
  query: string;
}) {
  const a = node.affiliate as TreeAffiliate;
  const hasChildren = node.children.length > 0;
  const defaultOpen = depth < 2;
  const isOpen = query
    ? visibleIds.has(a.id) &&
      node.children.some((c) => visibleIds.has(c.affiliate.id))
    : a.id in expanded
      ? expanded[a.id]
      : defaultOpen;
  const dimmed = Boolean(query) && !visibleIds.has(a.id);

  return (
    <li className="relative">
      {depth > 0 ? (
        <span
          className="absolute -left-5 top-7 h-px w-5 bg-[#c5ced8] dark:bg-border"
          aria-hidden
        />
      ) : null}
      <PersonCard
        affiliate={a}
        selected={selectedId === a.id}
        reportCount={node.children.length}
        dimmed={dimmed}
        expanded={isOpen}
        onSelect={onSelect}
        onToggleReports={
          hasChildren ? () => onToggle(a.id, defaultOpen) : undefined
        }
      />
      {hasChildren && isOpen ? (
        <ul className="relative ml-6 mt-3 space-y-3 border-l border-[#c5ced8] pl-5 dark:border-border">
          {node.children.map((child) => (
            <ListBranch
              key={child.affiliate.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
              visibleIds={visibleIds}
              query={query}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PeopleTreeView({
  tree,
  selectedId,
  onSelect,
}: {
  tree: AffiliateTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const desktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const normalizedQuery = query.trim().toLowerCase();
  const visibleIds = useMemo(
    () => collectVisibleIds(tree, normalizedQuery),
    [tree, normalizedQuery]
  );

  function toggle(id: string, defaultOpen: boolean) {
    setExpanded((prev) => {
      const current = id in prev ? prev[id] : defaultOpen;
      return { ...prev, [id]: !current };
    });
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const id of collectAllIds(tree)) next[id] = true;
    setExpanded(next);
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const id of collectAllIds(tree)) next[id] = false;
    setExpanded(next);
  }

  if (tree.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted">
        No people in the hierarchy yet.
      </p>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col bg-[#f4f6f8] dark:bg-surface-elevated">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6ebf1] bg-white px-3 py-2.5 dark:border-border-subtle dark:bg-surface-elevated">
        <label className="relative min-w-[180px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or code"
            className="h-9 w-full rounded-lg border border-[#e6ebf1] bg-white px-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 dark:border-border dark:bg-surface dark:text-foreground dark:placeholder:text-muted"
          />
        </label>
        <Button type="button" size="sm" variant="secondary" onClick={expandAll}>
          Expand all
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={collapseAll}>
          Collapse all
        </Button>
      </div>

      <div className="overflow-auto p-6 sm:p-8">
        {desktop ? (
          <ul className="flex min-w-max justify-center">
            {tree.map((node, i) => (
              <OrgBranch
                key={node.affiliate.id}
                node={node}
                depth={0}
                index={i}
                siblingCount={tree.length}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={toggle}
                visibleIds={visibleIds}
                query={normalizedQuery}
              />
            ))}
          </ul>
        ) : (
          <ul className="min-w-[280px] space-y-3">
            {tree.map((node) => (
              <ListBranch
                key={node.affiliate.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={toggle}
                visibleIds={visibleIds}
                query={normalizedQuery}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
