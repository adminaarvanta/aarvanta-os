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

/** Hide Google chrome without destroying the translate engine in the DOM. */
function hideGoogleTranslateChrome() {
  document
    .querySelectorAll<HTMLElement>(
      ".goog-te-banner-frame, iframe.goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame"
    )
    .forEach((el) => {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
    });

  document.querySelectorAll<HTMLElement>("body > .skiptranslate").forEach((el) => {
    if (el.id === "google_translate_element") return;
    if (el.querySelector("#google_translate_element")) return;
    // Top bar Google injects after a language is active
    if (el.querySelector("iframe.goog-te-banner-frame, .goog-te-banner-frame")) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("height", "0", "important");
      el.style.setProperty("visibility", "hidden", "important");
    }
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
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
      hideGoogleTranslateChrome();
      setReady(true);
    };

    loadGoogleTranslateScript();

    const observer = new MutationObserver(() => hideGoogleTranslateChrome());
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      hideGoogleTranslateChrome();
      setReady(true);
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const setLanguage = useCallback((code: string) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    setGoogTransCookie(code);
    setLanguageState(code);
    document.documentElement.lang = code.startsWith("zh")
      ? code
      : code.split("-")[0];

    // Full reload — googtrans cookie is the reliable activation path
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
