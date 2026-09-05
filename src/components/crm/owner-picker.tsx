"use client";

import { Check, Plus, UserRound, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { crmInputClass } from "@/components/crm/crm-form";
import {
  findMemberByName,
  type OwnerSelection,
} from "@/lib/crm/owner-selection";
import type { MemberOption } from "@/lib/crm/members";
import { cn } from "@/lib/utils";

export function OwnerPicker({
  members,
  value,
  onChange,
  onCommit,
  id,
  compact = false,
}: {
  members: MemberOption[];
  value: OwnerSelection;
  onChange: (value: OwnerSelection) => void;
  onCommit?: (value: OwnerSelection) => void;
  id?: string;
  compact?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState(value.kind === "none" ? "" : value.name);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    setQuery(value.kind === "none" ? "" : value.name);
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    function syncPosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? members.filter((member) => member.name.toLowerCase().includes(q))
      : members;
    return list.slice(0, 8);
  }, [members, query]);

  const exact = findMemberByName(members, query);
  const canCreate = query.trim().length > 0 && !exact;
  const optionCount = filtered.length + (canCreate ? 1 : 0);

  function applyQuery(next: string) {
    setQuery(next);
    const match = findMemberByName(members, next);
    if (!next.trim()) {
      onChange({ kind: "none" });
      return;
    }
    if (match) {
      onChange({ kind: "existing", id: match.userId, name: match.name });
      return;
    }
    onChange({ kind: "new", name: next.trim() });
  }

  function selectExisting(member: MemberOption) {
    const next: OwnerSelection = {
      kind: "existing",
      id: member.userId,
      name: member.name,
    };
    onChange(next);
    onCommit?.(next);
    setQuery(member.name);
    setOpen(false);
  }

  function selectNew(name: string) {
    const next: OwnerSelection = { kind: "new", name: name.trim() };
    onChange(next);
    onCommit?.(next);
    setQuery(name.trim());
    setOpen(false);
  }

  function clear() {
    const next: OwnerSelection = { kind: "none" };
    onChange(next);
    onCommit?.(next);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % Math.max(optionCount, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) =>
        (current - 1 + Math.max(optionCount, 1)) % Math.max(optionCount, 1)
      );
      return;
    }
    if (event.key === "Enter" && open && optionCount > 0) {
      event.preventDefault();
      if (highlight < filtered.length) {
        const member = filtered[highlight];
        if (member) selectExisting(member);
        return;
      }
      if (canCreate) selectNew(query);
    }
  }

  const hint =
    value.kind === "new"
      ? `We’ll add “${value.name}” as a new owner.`
      : value.kind === "existing"
        ? `Assigned to ${value.name}.`
        : "Search an existing owner, or type a new name.";

  const menu =
    open && menuBox && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            className="fixed z-[90] max-h-64 overflow-auto rounded-xl border border-border bg-surface-elevated py-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            {filtered.map((member, index) => {
              const selected =
                value.kind === "existing" && value.id === member.userId;
              return (
                <li key={member.userId} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => selectExisting(member)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                      highlight === index
                        ? "bg-sky-500/[0.10] text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                    )}
                  >
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{member.name}</span>
                    {selected ? (
                      <Check className="h-3.5 w-3.5 text-[#2f7f92]" />
                    ) : null}
                  </button>
                </li>
              );
            })}
            {canCreate ? (
              <li role="option" aria-selected={value.kind === "new"}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(filtered.length)}
                  onClick={() => selectNew(query)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                    highlight === filtered.length
                      ? "bg-sky-500/[0.10] text-foreground"
                      : "text-foreground hover:bg-surface-muted"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1a2f59]/10 text-[#1a2f59]">
                    <Plus className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    Add “{query.trim()}” as a new owner
                  </span>
                </button>
              </li>
            ) : null}
            {optionCount === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">
                Start typing to add an owner.
              </li>
            ) : null}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <UserRound
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            applyQuery(event.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search or add an owner"
          autoComplete="off"
          className={cn(crmInputClass, "pl-10 pr-10")}
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Clear owner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {compact ? null : (
        <p className="mt-1.5 text-[11px] leading-4 text-muted">{hint}</p>
      )}
      {menu}
    </div>
  );
}
