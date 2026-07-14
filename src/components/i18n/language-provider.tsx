"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LANGUAGE_STORAGE_KEY,
  SOURCE_LANGUAGE,
  clearGoogTransCookies,
  readStoredLanguage,
  setGoogTransCookie,
} from "@/lib/i18n/languages";

type LanguageContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: Record<string, unknown>,
          elementId: string
        ) => void;
      };
    };
  }
}

const BANNER_SELECTORS = [
  "iframe.goog-te-banner-frame",
  ".goog-te-banner-frame",
  "iframe.skiptranslate",
  "#goog-gt-tt",
  ".goog-te-balloon-frame",
  ".goog-te-menu-frame",
  ".VIpgJd-ZVi9od-ORHb",
  ".VIpgJd-ZVi9od-ORHb-OEYmcd",
  ".VIpgJd-ZVi9od-l4eHX-hSRGPd",
  ".VIpgJd-yAWNEb-L7lbkb",
].join(", ");

function nukeBannerEl(el: HTMLElement) {
  el.style.setProperty("display", "none", "important");
  el.style.setProperty("visibility", "hidden", "important");
  el.style.setProperty("opacity", "0", "important");
  el.style.setProperty("height", "0", "important");
  el.style.setProperty("width", "0", "important");
  el.style.setProperty("max-height", "0", "important");
  el.style.setProperty("border", "none", "important");
  el.style.setProperty("pointer-events", "none", "important");
  el.setAttribute("aria-hidden", "true");
}

/** Hide Google chrome without destroying the translate engine host. */
function hideGoogleTranslateChrome() {
  document.querySelectorAll<HTMLElement>(BANNER_SELECTORS).forEach((el) => {
    if (el.closest("#google_translate_element")) return;
    nukeBannerEl(el);
  });

  Array.from(document.body.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (child.id === "google_translate_element") return;
    if (child.querySelector?.("#google_translate_element")) return;

    const isBannerWrapper =
      child.classList.contains("skiptranslate") ||
      (child.tagName === "IFRAME" &&
        (child.classList.contains("skiptranslate") ||
          child.classList.contains("goog-te-banner-frame"))) ||
      Boolean(
        child.querySelector?.(
          "iframe.goog-te-banner-frame, .goog-te-banner-frame"
        )
      );

    if (isBannerWrapper) nukeBannerEl(child);
  });

  document.body.style.setProperty("top", "0", "important");
  document.body.style.setProperty("position", "static", "important");
  document.documentElement.style.setProperty("top", "0", "important");
}

function loadGoogleTranslateScript() {
  if (document.getElementById("google-translate-script")) return;
  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

function hardReloadOriginalPage() {
  // Full navigation (not just reload) helps drop in-memory GT session state
  const url = window.location.pathname + window.location.search;
  window.location.replace(url);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState(SOURCE_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLanguage();
    setLanguageState(stored);
    setGoogTransCookie(stored);
    document.documentElement.lang = stored.startsWith("zh")
      ? stored
      : stored.split("-")[0];

    // English = original site — do NOT load Google Translate at all
    if (stored === SOURCE_LANGUAGE) {
      clearGoogTransCookies();
      setReady(true);
      return;
    }

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
      hideGoogleTranslateChrome();
      window.setTimeout(hideGoogleTranslateChrome, 200);
      window.setTimeout(hideGoogleTranslateChrome, 800);
      window.setTimeout(hideGoogleTranslateChrome, 2000);
      setReady(true);
    };

    loadGoogleTranslateScript();

    const observer = new MutationObserver(() => hideGoogleTranslateChrome());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const offsetTimer = window.setInterval(() => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0", "important");
      }
      hideGoogleTranslateChrome();
    }, 1000);

    const readyTimer = window.setTimeout(() => {
      hideGoogleTranslateChrome();
      setReady(true);
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearInterval(offsetTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  const setLanguage = useCallback((code: string) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }

    setLanguageState(code);
    document.documentElement.lang = code.startsWith("zh")
      ? code
      : code.split("-")[0];

    if (code === SOURCE_LANGUAGE) {
      // Fully wipe GT cookies/hash, then hard-navigate to fresh English page
      clearGoogTransCookies();
      hardReloadOriginalPage();
      return;
    }

    setGoogTransCookie(code);
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, ready }),
    [language, setLanguage, ready]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div
        id="google_translate_element"
        className="google-translate-host notranslate"
        aria-hidden
        translate="no"
      />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
