import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DirectionProvider } from "../ui/direction";
import { dictionaries, type Locale } from "./translations";

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function AppI18nProvider({ children, syncLocale }: { children: ReactNode; syncLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (syncLocale === "ar" || syncLocale === "en") return syncLocale;
    const stored = localStorage.getItem("fawtarly_locale");
    if (stored === "ar" || stored === "en") return stored;
    const lang = navigator.language.toLowerCase();
    return lang.startsWith("ar") ? "ar" : "en";
  });

  useEffect(() => {
    if (syncLocale === "ar" || syncLocale === "en") {
      setLocaleState(syncLocale);
    }
  }, [syncLocale]);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("fawtarly_locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [dir, locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t: (key: string) => dictionaries[locale][key] || dictionaries.en[key] || key,
    }),
    [dir, locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>
      <DirectionProvider direction={dir}>{children}</DirectionProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside AppI18nProvider");
  return context;
}
