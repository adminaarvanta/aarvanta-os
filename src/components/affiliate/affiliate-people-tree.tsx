"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
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

function roleLabel(role: AffiliateRole | undefined): string {
  return role === "regional_manager" ? "Regional manager" : "Partner";
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

export function PersonCard({
  affiliate,
  selected,
  reportCount,
  onSelect,
}: {
  affiliate: TreeAffiliate;
  selected: boolean;
  reportCount: number;
  onSelect: (id: string) => void;
}) {
  const role = affiliate.role ?? "partner";
  return (
    <button
      type="button"
      onClick={() => onSelect(affiliate.id)}
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        selected
          ? "border-gold bg-gold/10 ring-1 ring-gold/40"
          : "border-border bg-surface hover:border-gold/35 hover:bg-surface-muted/50"
      }`}
    >
      <span
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          role === "regional_manager"
            ? "bg-gold/20 text-gold"
            : "bg-surface-muted text-foreground"
        }`}
        aria-hidden
      >
        {initials(affiliate.profile.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
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
          {roleLabel(role)} · {affiliate.profile.regionCode} ·{" "}
          {affiliate.referralCode}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {affiliate.profile.email}
          {affiliate.needsPasswordSetup ? " · awaiting password" : ""}
        </span>
        {reportCount > 0 ? (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
            <Users className="h-3 w-3" aria-hidden />
            {reportCount} direct report{reportCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function TreeBranch({
  node,
  depth,
  selectedId,
  onSelect,
  defaultExpanded,
}: {
  node: AffiliateTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const a = node.affiliate as TreeAffiliate;
  const hasChildren = node.children.length > 0;

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
            className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse reports" : "Expand reports"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
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
          onSelect={onSelect}
        />
      </div>

      {hasChildren && expanded ? (
        <ul className="relative ml-[13px] mt-1 space-y-2 border-l border-border pl-5">
          {node.children.map((child) => (
            <TreeBranch
              key={child.affiliate.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              defaultExpanded={depth + 1 < 1}
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
  if (tree.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted">
        No affiliates yet. Approve partners to build the hierarchy.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto p-3 sm:p-4">
      <ul className="min-w-[280px] space-y-4">
        {tree.map((node) => (
          <TreeBranch
            key={node.affiliate.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            defaultExpanded
          />
        ))}
      </ul>
    </div>
  );
}
