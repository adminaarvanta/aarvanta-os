"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  Compass,
  Keyboard,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { NinetySecondDemoPanel } from "@/components/demo/ninety-second-demo-panel";
import { useDemoTourOptional } from "@/components/demo/demo-tour-provider";
import { DEMO_TOUR_STEPS } from "@/lib/demo/tour-steps";
import { cn } from "@/lib/utils";

function HelpLiveDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-live-demo-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#243656] bg-[#0D1524] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="help-live-demo-title" className="text-lg font-semibold text-[#FFFFFF]">
              90-Second Live Demo
            </h2>
            <p className="mt-1 text-sm text-[#9AABC4]">
              One click runs the full business story for your audience.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9AABC4] hover:bg-[#162840] hover:text-[#FFFFFF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div data-demo-tour="live-demo-run">
          <NinetySecondDemoPanel compact />
        </div>
      </div>
    </div>
  );
}

export function HelpMenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tour = useDemoTourOptional();
  const rootRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [liveDemoOpen, setLiveDemoOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const startTour = useCallback(() => {
    closeMenu();
    tour?.startTour(0);
  }, [closeMenu, tour]);

  const openLiveDemo = useCallback(() => {
    closeMenu();
    setLiveDemoOpen(true);
  }, [closeMenu]);

  const jumpToLiveDemoTour = useCallback(() => {
    closeMenu();
    const index = DEMO_TOUR_STEPS.findIndex((s) => s.id === "live-demo");
    tour?.startTour(index >= 0 ? index : 0);
  }, [closeMenu, tour]);

  useEffect(() => {
    const help = searchParams.get("help");
    if (!help) return;

    if (help === "open") setMenuOpen(true);
    if (help === "tour") tour?.startTour(0);
    if (help === "live") setLiveDemoOpen(true);

    const url = new URL(window.location.href);
    url.searchParams.delete("help");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router, searchParams, tour]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, menuOpen]);

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          data-demo-tour="help-trigger"
          onClick={() => setMenuOpen((value) => !value)}
          className={cn(
            "group relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all sm:px-4",
            menuOpen
              ? "border-[#B8965D] bg-[#B8965D]/20 text-[#C9AA72] shadow-[0_0_24px_rgba(184, 150, 93,0.25)]"
              : "border-[#B8965D]/45 bg-gradient-to-r from-[#B8965D]/15 to-[#B8965D]/5 text-[#FFFFFF] shadow-[0_0_16px_rgba(184, 150, 93,0.12)] hover:border-[#B8965D] hover:from-[#B8965D]/25 hover:to-[#B8965D]/10 hover:text-[#C9AA72]"
          )}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B8965D] opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B8965D]" />
          </span>
          <CircleHelp className="h-4 w-4 text-[#B8965D] transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Help</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden rounded-xl border border-[#243656] bg-[#0D1524] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-[#243656] bg-gradient-to-r from-[#B8965D]/10 to-transparent px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#B8965D]">
                Help &amp; demo
              </p>
              <p className="mt-0.5 text-sm text-[#FFFFFF]">Learn and present Aarvanta OS</p>
            </div>

            <ul className="p-2">
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={startTour}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#162840]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B8965D]/15 text-[#B8965D]">
                    <Compass className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#FFFFFF]">
                      Product tour
                    </span>
                    <span className="mt-0.5 block text-xs text-[#9AABC4]">
                      Step-by-step walkthrough with spotlight highlights
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  data-demo-tour="help-live-demo"
                  onClick={openLiveDemo}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#162840]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950/80 text-emerald-400">
                    <Play className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#FFFFFF]">
                      90-second live demo
                    </span>
                    <span className="mt-0.5 block text-xs text-[#9AABC4]">
                      Full lead-to-delivery journey in one click
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={jumpToLiveDemoTour}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#162840]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#121E32] text-[#B8965D]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#FFFFFF]">
                      Tour demo step only
                    </span>
                    <span className="mt-0.5 block text-xs text-[#9AABC4]">
                      Jump to the live demo highlight in the tour
                    </span>
                  </span>
                </button>
              </li>
            </ul>

            <div className="border-t border-[#243656] px-4 py-3 space-y-2">
              <p className="flex items-center gap-2 text-[10px] text-[#9AABC4]">
                <Keyboard className="h-3 w-3 shrink-0" />
                During tour: ← → navigate · Esc to exit
              </p>
              <Link
                href="/knowledge"
                onClick={closeMenu}
                className="flex items-center gap-2 text-xs text-[#B8965D] hover:underline"
              >
                <BookOpen className="h-3 w-3" />
                Browse knowledge base
              </Link>
            </div>
          </div>
        )}
      </div>

      <HelpLiveDemoModal open={liveDemoOpen} onClose={() => setLiveDemoOpen(false)} />
    </>
  );
}
