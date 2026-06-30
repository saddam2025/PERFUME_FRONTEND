import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "toronto_locale";

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(STORAGE_KEY) || "en";
  });

  const isRTL = locale === "ar";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, isRTL]);

  const toggleLocale = () => setLocale((prev) => (prev === "en" ? "ar" : "en"));

  const t = useMemo(() => {
    return (key, vars) => {
      const dict = translations[locale] || translations.en;
      let value = getNested(dict, key);
      if (value === undefined) {
        value = getNested(translations.en, key);
      }
      if (value === undefined) return key;
      if (Array.isArray(value)) return value;
      if (typeof value === "string" && vars) {
        return Object.entries(vars).reduce(
          (str, [varKey, varVal]) => str.replace(`{${varKey}}`, varVal),
          value
        );
      }
      return value;
    };
  }, [locale]);

  const value = { locale, isRTL, setLocale, toggleLocale, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
