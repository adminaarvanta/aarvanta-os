"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { filterCommands } from "@/lib/founder/commands";

export function FounderCommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = filterCommands(query);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActiveIndex(0);
      }
      if (!open) return;

      if (e.key === "Escape") close();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, commands.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && commands[activeIndex]) {
        e.preventDefault();
        router.push(commands[activeIndex].href);
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, commands, activeIndex, router, close]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const grouped = commands.reduce<Record<string, typeof commands>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={close}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#3d3528] bg-[#0a0a0a] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command bar"
      >
        <div className="flex items-center gap-3 border-b border-[#3d3528] px-4 py-3">
          <Search className="h-4 w-4 text-[#A89878]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-sm text-[#F5E6C8] outline-none placeholder:text-[#A89878]/60"
          />
          <kbd className="hidden rounded border border-[#3d3528] px-1.5 py-0.5 text-[10px] text-[#A89878] sm:inline">
            esc
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto overscroll-contain p-2">
          {commands.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[#A89878]">No commands found.</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#A89878]">
                  {group}
                </p>
                <ul>
                  {items.map((cmd) => {
                    const idx = commands.indexOf(cmd);
                    const active = idx === activeIndex;
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(cmd.href);
                            close();
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${
                            active
                              ? "bg-[#D4AF37]/15 text-[#F9E076]"
                              : "text-[#F5E6C8] hover:bg-[#141414]"
                          }`}
                        >
                          {cmd.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#3d3528] px-4 py-2 text-[10px] text-[#A89878]">
          <span className="hidden sm:inline">↑↓ navigate · ↵ open · </span>
          <kbd className="rounded border border-[#3d3528] px-1">⌘K</kbd> toggle
        </div>
      </div>
    </div>
  );
}
