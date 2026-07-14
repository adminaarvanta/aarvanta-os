"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Globe2, Search } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  APP_LANGUAGES,
  POPULAR_LANGUAGE_CODES,
  languageByCode,
} from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = languageByCode(language) ?? APP_LANGUAGES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const popular = POPULAR_LANGUAGE_CODES.map((code) =>
        languageByCode(code)
      ).filter((l): l is NonNullable<typeof l> => Boolean(l));
      const rest = APP_LANGUAGES.filter(
        (l) => !POPULAR_LANGUAGE_CODES.includes(l.code)
      );
      return [...popular, ...rest];
    }
    return APP_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={cn("relative notranslate", className)} translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 text-muted transition-colors hover:border-gold/40 hover:bg-surface-hover hover:text-foreground",
          compact && "px-2"
        )}
        aria-label={`Language: ${current.name}`}
        aria-expanded={open}
        title="Change language"
      >
        <Globe2 className="h-4 w-4 shrink-0 text-gold" />
        {!compact && (
          <span className="hidden max-w-[4.5rem] truncate text-xs font-medium text-foreground sm:inline">
            {current.name}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close language menu"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <div className="absolute right-0 z-50 mt-2 flex w-[min(calc(100vw-1.5rem),17.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl">
            <div className="border-b border-border-subtle px-3 pt-3 pb-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                Language
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-dim"
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {filtered.map((lang) => {
                const active = lang.code === language;
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        if (lang.code !== language) setLanguage(lang.code);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover",
                        active ? "bg-gold/10 text-gold" : "text-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {lang.name}
                        </span>
                        {lang.nativeName !== lang.name && (
                          <span className="block truncate text-[11px] text-muted">
                            {lang.nativeName}
                          </span>
                        )}
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-gold" />}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted">
                  No matches
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
