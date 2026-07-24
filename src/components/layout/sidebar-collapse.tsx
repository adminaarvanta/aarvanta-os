"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "aarvanta.sidebar.collapsed";

type SidebarCollapseContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
  /** True when route prefers a collapsed shell (e.g. Build OS). */
  routePrefersCollapsed: boolean;
};

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(
  null
);

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routePrefersCollapsed =
    pathname === "/build" || pathname.startsWith("/build/");
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  /** Session-only expand while on Build OS — always start collapsed when entering. */
  const [buildExpanded, setBuildExpanded] = useState(false);
  const wasOnBuild = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setUserCollapsed(true);
      else if (raw === "0") setUserCollapsed(false);
      else setUserCollapsed(null);
    } catch {
      setUserCollapsed(null);
    }
  }, []);

  useEffect(() => {
    if (routePrefersCollapsed && !wasOnBuild.current) {
      setBuildExpanded(false);
    }
    wasOnBuild.current = routePrefersCollapsed;
  }, [routePrefersCollapsed]);

  const collapsed = useMemo(() => {
    if (routePrefersCollapsed) return !buildExpanded;
    return userCollapsed ?? false;
  }, [routePrefersCollapsed, buildExpanded, userCollapsed]);

  const setCollapsed = useCallback(
    (value: boolean) => {
      if (routePrefersCollapsed) {
        setBuildExpanded(!value);
        return;
      }
      setUserCollapsed(value);
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [routePrefersCollapsed]
  );

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggle, routePrefersCollapsed }),
    [collapsed, setCollapsed, toggle, routePrefersCollapsed]
  );

  return (
    <SidebarCollapseContext.Provider value={value}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggle: () => {},
      routePrefersCollapsed: false,
    };
  }
  return ctx;
}
