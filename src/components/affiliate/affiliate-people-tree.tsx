"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_ROOT_EMAIL } from "@/lib/affiliate/constants";
import type { Affiliate, AffiliateRole, AffiliateTreeNode } from "@/types/affiliate";

export type TreeAffiliate = Affiliate & {
  needsPasswordSetup?: boolean;
  role?: AffiliateRole;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
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

function statusClass(status: Affiliate["status"]): string {
  switch (status) {
    case "active":
      return "bg-success/15 text-success";
    case "pending":
      return "bg-gold/15 text-gold";
    case "suspended":
      return "bg-red-500/15 text-red-400";
    default:
      return "bg-surface-muted text-muted";
  }
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

  function walk(
    node: AffiliateTreeNode,
    ancestors: string[]
  ): boolean {
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

export function PersonCard({
  affiliate,
  selected,
  reportCount,
  dimmed,
  onSelect,
}: {
  affiliate: TreeAffiliate;
  selected: boolean;
  reportCount: number;
  dimmed?: boolean;
  onSelect: (id: string) => void;
}) {
  const label = hierarchyLabel(affiliate);
  const isOwner = label === "Owner";
  const isTeam = label === "Team" || isOwner;

  return (
    <button
      type="button"
      onClick={() => onSelect(affiliate.id)}
      className={`flex w-[220px] max-w-[calc(100vw-3rem)] items-start gap-3 rounded-xl border px-3 py-2.5 text-left shadow-sm transition ${
        selected
          ? "border-gold bg-gold/10 ring-1 ring-gold/40"
          : "border-border bg-surface hover:border-gold/35 hover:bg-surface-muted/50"
      } ${dimmed ? "opacity-35" : ""}`}
    >
      <span
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isOwner
            ? "bg-gold/20 text-gold"
            : isTeam
              ? "bg-navy/15 text-navy dark:bg-gold/15 dark:text-gold"
              : "bg-surface-muted text-foreground"
        }`}
        aria-hidden
      >
        {initials(affiliate.profile.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {affiliate.profile.name}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusClass(affiliate.status)}`}
          >
            {affiliate.status}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {label} · {affiliate.referralCode}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {affiliate.profile.email}
          {affiliate.needsPasswordSetup ? " · awaiting password" : ""}
        </span>
        {reportCount > 0 ? (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
            <Users className="h-3 w-3" aria-hidden />
            {reportCount} report{reportCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>
    </button>
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
    ? visibleIds.has(a.id) && node.children.some((c) => visibleIds.has(c.affiliate.id))
    : a.id in expanded
      ? expanded[a.id]
      : defaultOpen;
  const dimmed = Boolean(query) && !visibleIds.has(a.id);
  const isFirst = index === 0;
  const isLast = index === siblingCount - 1;

  return (
    <li
      className={`relative flex flex-col items-center px-3 pt-5 ${
        depth > 0
          ? "before:absolute before:left-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-border"
          : ""
      } ${
        depth > 0 && siblingCount > 1
          ? `after:absolute after:top-0 after:h-px after:bg-border ${
              isFirst
                ? "after:left-1/2 after:right-0"
                : isLast
                  ? "after:left-0 after:right-1/2"
                  : "after:left-0 after:right-0"
            }`
          : ""
      }`}
    >
      <div className="flex items-start gap-1">
        {hasChildren ? (
          <button
            type="button"
            className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse reports" : "Expand reports"}
            onClick={() => onToggle(a.id, defaultOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="mt-3 h-7 w-7 shrink-0" aria-hidden />
        )}
        <PersonCard
          affiliate={a}
          selected={selectedId === a.id}
          reportCount={node.children.length}
          dimmed={dimmed}
          onSelect={onSelect}
        />
      </div>
      {hasChildren && isOpen ? (
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
    ? visibleIds.has(a.id) && node.children.some((c) => visibleIds.has(c.affiliate.id))
    : a.id in expanded
      ? expanded[a.id]
      : defaultOpen;
  const dimmed = Boolean(query) && !visibleIds.has(a.id);

  return (
    <li className="relative">
      {depth > 0 ? (
        <span
          className="absolute -left-5 top-5 h-px w-5 bg-border"
          aria-hidden
        />
      ) : null}
      <div className="flex items-start gap-1">
        {hasChildren ? (
          <button
            type="button"
            className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse reports" : "Expand reports"}
            onClick={() => onToggle(a.id, defaultOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="mt-3 h-11 w-11 shrink-0" aria-hidden />
        )}
        <PersonCard
          affiliate={a}
          selected={selectedId === a.id}
          reportCount={node.children.length}
          dimmed={dimmed}
          onSelect={onSelect}
        />
      </div>
      {hasChildren && isOpen ? (
        <ul className="relative ml-[21px] mt-1 space-y-2 border-l border-border pl-5">
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
    <div className="flex min-h-[320px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <label className="relative min-w-[180px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or code"
            className="h-9 w-full rounded-lg border border-border bg-surface px-8 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </label>
        <Button type="button" size="sm" variant="secondary" onClick={expandAll}>
          Expand all
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={collapseAll}>
          Collapse all
        </Button>
      </div>

      <div className="overflow-auto p-3 sm:p-4">
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
