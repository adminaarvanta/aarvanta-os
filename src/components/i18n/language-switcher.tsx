"use client";

import { useMemo, useState } from "react";
import { Check, Languages, Search } from "lucide-react";
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
      const popular = POPULAR_LANGUAGE_CODES.map((code) => languageByCode(code)!).filter(
        Boolean
      );
      const rest = APP_LANGUAGES.filter((l) => !POPULAR_LANGUAGE_CODES.includes(l.code));
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
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
          compact ? "" : "sm:px-3"
        )}
        aria-label={`Language: ${current.name}`}
        title="Language"
      >
        <Languages className="h-[18px] w-[18px]" />
        {!compact && (
          <span className="hidden max-w-[5.5rem] truncate text-xs font-medium sm:inline">
            {current.nativeName}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close language menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 flex w-[min(calc(100vw-1.5rem),18rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
            <div className="border-b border-border-subtle p-2">
              <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search languages…"
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
                        if (lang.code !== language) setLanguage(lang.code);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover",
                        active ? "text-gold" : "text-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{lang.nativeName}</span>
                        <span className="block truncate text-[11px] text-muted">
                          {lang.name}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-gold" />}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted">No matches</li>
              )}
            </ul>
            <p className="border-t border-border-subtle px-3 py-2 text-[10px] text-dim">
              Powered by Google Translate (free)
            </p>
          </div>
        </>
      )}
    </div>
  );
}
