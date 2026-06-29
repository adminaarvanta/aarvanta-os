"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  FolderKanban,
  Inbox,
  Loader2,
  Search,
  Sparkles,
  User,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalSearchResult, GlobalSearchResponse, SearchResultKind } from "@/types/search";

const KIND_ICONS: Record<SearchResultKind, typeof Search> = {
  feature: Sparkles,
  contact: User,
  company: Building2,
  deal: Zap,
  project: FolderKanban,
  document: FileText,
  conversation: Inbox,
  workflow: Workflow,
  proposal: FileText,
};

function groupResults(results: GlobalSearchResult[]) {
  return results.reduce<Record<string, GlobalSearchResult[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
}

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatResults = results;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(0);
  }, []);

  const selectResult = useCallback(
    (result: GlobalSearchResult) => {
      router.push(result.href);
      setQuery("");
      setResults([]);
      close();
      inputRef.current?.blur();
    },
    [router, close]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length === 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, limit: "20" });
        const res = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as GlobalSearchResponse;
        setResults(data.results);
        setActiveIndex(0);
      } catch {
        /* aborted or network error */
      } finally {
        setLoading(false);
      }
    }, trimmed ? 350 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      inputRef.current?.blur();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && flatResults[activeIndex]) {
      e.preventDefault();
      selectResult(flatResults[activeIndex]);
    }
  }

  const grouped = groupResults(flatResults);
  const showDropdown = open && (loading || flatResults.length > 0 || query.length > 0);

  return (
    <div ref={rootRef} data-demo-tour="global-search" className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg bg-surface-muted px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.25)] transition-[box-shadow,background-color] sm:px-3.5",
          open
            ? "bg-surface-hover shadow-[inset_0_1px_0_rgba(212,175,55,0.08),0_0_0_1px_rgba(212,175,55,0.18),0_4px_16px_rgba(0,0,0,0.3)]"
            : "hover:bg-surface-hover/80"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#A89878]" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-[#A89878]" />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder="Search…"
          aria-label="Global search"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#F5E6C8] outline-none placeholder:text-[#A89878]/60"
        />
        <kbd className="hidden shrink-0 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[#A89878] shadow-sm sm:inline">
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-[#0a0a0a] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
          role="presentation"
        >
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain p-2"
          >
            {loading && flatResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#A89878]">Searching…</p>
            ) : flatResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#A89878]">
                {query ? `No results for “${query}”` : "Start typing to search"}
              </p>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#A89878]">
                    {group}
                  </p>
                  <ul>
                    {items.map((item) => {
                      const idx = flatResults.indexOf(item);
                      const active = idx === activeIndex;
                      const Icon = KIND_ICONS[item.kind];
                      return (
                        <li key={item.id} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => selectResult(item)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                              active
                                ? "bg-[#D4AF37]/15 text-[#F9E076]"
                                : "text-[#F5E6C8] hover:bg-[#141414]"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active ? "text-[#D4AF37]" : "text-[#A89878]"
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">{item.title}</span>
                              {item.subtitle && (
                                <span className="block truncate text-xs text-[#A89878]">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
          <div className="bg-black/20 px-3 py-2 text-[10px] text-[#A89878]">
            <span className="hidden sm:inline">↑↓ navigate · ↵ open · </span>
            <kbd className="rounded bg-black/30 px-1 shadow-sm">esc</kbd> close
          </div>
        </div>
      )}
    </div>
  );
}
