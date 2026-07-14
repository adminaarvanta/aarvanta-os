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

function scrubGoogleTranslateChrome() {
  document
    .querySelectorAll(
      [
        ".goog-te-banner-frame",
        "iframe.goog-te-banner-frame",
        ".skiptranslate",
        "#goog-gt-tt",
        ".goog-te-balloon-frame",
        ".VIpgJd-ZVi9od-ORHb",
        ".VIpgJd-ZVi9od-ORHb-OEYmcd",
        ".VIpgJd-ZVi9od-l4eHX-hSRGPd",
      ].join(", ")
    )
    .forEach((el) => {
      // Keep our hidden host; remove Google's injected chrome only
      if (el.id === "google_translate_element") return;
      if (el.classList?.contains("google-translate-host")) return;
      if (el.closest?.("#google_translate_element")) return;
      el.remove();
    });

  document.body.style.setProperty("top", "0", "important");
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

function applyLangToHiddenSelect(code: string) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;
  const value = code === SOURCE_LANGUAGE ? SOURCE_LANGUAGE : code;
  if (select.value === value) return true;
  select.value = value;
  select.dispatchEvent(new Event("change"));
  return true;
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

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      // Hidden host only — never show Google's own UI
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          autoDisplay: false,
          layout: 0,
        },
        "google_translate_element"
      );
      scrubGoogleTranslateChrome();
      if (stored !== SOURCE_LANGUAGE) {
        window.setTimeout(() => applyLangToHiddenSelect(stored), 400);
      }
      setReady(true);
    };

    loadGoogleTranslateScript();

    const observer = new MutationObserver(() => scrubGoogleTranslateChrome());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const timer = window.setTimeout(() => {
      scrubGoogleTranslateChrome();
      setReady(true);
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    setGoogTransCookie(code);
    document.documentElement.lang = code.startsWith("zh")
      ? code
      : code.split("-")[0];

    // Prefer in-place switch; fall back to reload if widget isn't ready
    const applied = applyLangToHiddenSelect(code);
    if (!applied) {
      window.location.reload();
      return;
    }
    scrubGoogleTranslateChrome();
    // English → full page reload clears leftover translated DOM
    if (code === SOURCE_LANGUAGE) {
      window.location.reload();
    }
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
