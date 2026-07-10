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
      <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#3d3528] bg-[#101010] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="help-live-demo-title" className="text-lg font-semibold text-[#F5E6C8]">
              90-Second Live Demo
            </h2>
            <p className="mt-1 text-sm text-[#A89878]">
              One click runs the full business story for your audience.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
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
            "group relative flex items-center gap-2 rounded-lg border border-border p-2.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
            menuOpen && "border-primary/30 bg-primary-soft text-primary"
          )}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <CircleHelp className="h-[18px] w-[18px]" />
          <span className="sr-only">Help</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden rounded-xl border border-[#3d3528] bg-[#101010] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-[#3d3528] bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#D4AF37]">
                Help &amp; demo
              </p>
              <p className="mt-0.5 text-sm text-[#F5E6C8]">Learn and present Aarvanta OS</p>
            </div>

            <ul className="p-2">
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={startTour}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#1a1714]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
                    <Compass className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#F5E6C8]">
                      Product tour
                    </span>
                    <span className="mt-0.5 block text-xs text-[#A89878]">
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
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#1a1714]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0A2A33] text-[#4DA6FF]">
                    <Play className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#F5E6C8]">
                      90-second live demo
                    </span>
                    <span className="mt-0.5 block text-xs text-[#A89878]">
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
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#1a1714]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141414] text-[#D4AF37]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#F5E6C8]">
                      Tour demo step only
                    </span>
                    <span className="mt-0.5 block text-xs text-[#A89878]">
                      Jump to the live demo highlight in the tour
                    </span>
                  </span>
                </button>
              </li>
            </ul>

            <div className="border-t border-[#3d3528] px-4 py-3 space-y-2">
              <p className="flex items-center gap-2 text-[10px] text-[#A89878]">
                <Keyboard className="h-3 w-3 shrink-0" />
                During tour: ← → navigate · Esc to exit
              </p>
              <Link
                href="/knowledge"
                onClick={closeMenu}
                className="flex items-center gap-2 text-xs text-[#D4AF37] hover:underline"
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
