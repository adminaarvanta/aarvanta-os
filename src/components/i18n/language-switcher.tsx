"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const current = languageByCode(language) ?? APP_LANGUAGES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const placeMenu = () => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 24);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const maxHeight = Math.min(480, Math.max(spaceBelow, spaceAbove, 220));
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const left = Math.min(
      Math.max(12, rect.right - width),
      window.innerWidth - width - 12
    );
    setMenuStyle({
      position: "fixed",
      left,
      width,
      maxHeight,
      zIndex: 80,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
    const onReposition = () => placeMenu();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const { popular, rest, matches } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (l: (typeof APP_LANGUAGES)[number]) =>
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q);

    if (q) {
      const found = APP_LANGUAGES.filter(hit);
      return { popular: [] as typeof APP_LANGUAGES, rest: found, matches: found.length };
    }

    const popularLangs = POPULAR_LANGUAGE_CODES.map((code) =>
      languageByCode(code)
    ).filter((l): l is NonNullable<typeof l> => Boolean(l));

    const restLangs = APP_LANGUAGES.filter(
      (l) => !POPULAR_LANGUAGE_CODES.includes(l.code)
    );

    return {
      popular: popularLangs,
      rest: restLangs,
      matches: popularLangs.length + restLangs.length,
    };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const menu = open && mounted && (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70]"
        aria-label="Close language menu"
        onClick={close}
      />
      <div
        className="fixed z-[80] flex flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
        style={menuStyle}
        role="listbox"
        aria-label="All languages"
      >
        <div className="shrink-0 border-b border-border-subtle px-3 pt-3 pb-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
            All languages · {APP_LANGUAGES.length}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any language…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-dim"
              autoFocus
            />
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1">
          {!query && popular.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
              Popular
            </li>
          )}
          {popular.map((lang) => (
            <LanguageRow
              key={lang.code}
              lang={lang}
              active={lang.code === language}
              onSelect={() => {
                close();
                setLanguage(lang.code);
              }}
            />
          ))}
          {rest.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
              {query ? `Matches · ${matches}` : `All languages · ${rest.length}`}
            </li>
          )}
          {rest.map((lang) => (
            <LanguageRow
              key={lang.code}
              lang={lang}
              active={lang.code === language}
              onSelect={() => {
                close();
                setLanguage(lang.code);
              }}
            />
          ))}
          {matches === 0 && (
            <li className="px-3 py-4 text-center text-sm text-muted">
              No matches
            </li>
          )}
        </ul>
      </div>
    </>
  );

  return (
    <div className={cn("relative notranslate", className)} translate="no">
      <button
        ref={buttonRef}
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
      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}

function LanguageRow({
  lang,
  active,
  onSelect,
}: {
  lang: (typeof APP_LANGUAGES)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-lang={lang.code}
        onClick={onSelect}
        className={cn(
          "notranslate flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover",
          active ? "bg-gold/10 text-gold" : "text-foreground"
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">{lang.name}</span>
          {lang.nativeName !== lang.name && (
            <span className="ml-1.5 text-[11px] text-muted">
              {lang.nativeName}
            </span>
          )}
        </span>
        {active && <Check className="h-4 w-4 shrink-0 text-gold" />}
      </button>
    </li>
  );
}
