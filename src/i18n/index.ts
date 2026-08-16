import type { Locale, LocaleData } from "./types";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { fr } from "./locales/fr";
import { de } from "./locales/de";

export type { Locale, LocaleData } from "./types";

const LOCALES: Record<Locale, LocaleData> = { en, ru, fr, de };

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  fr: "Français",
  de: "Deutsch",
};

export const AUTO_LANGUAGE = "auto";
const DEFAULT_LOCALE = "ru";

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: AUTO_LANGUAGE, label: "Auto" },
  { value: "en", label: LOCALE_NAMES.en },
  { value: "ru", label: LOCALE_NAMES.ru },
  { value: "fr", label: LOCALE_NAMES.fr },
  { value: "de", label: LOCALE_NAMES.de },
];

let currentLocale: LocaleData = ru;

export const resolveLocale = (
  setting: string,
  obsidianLang?: string,
): Locale => {
  if (setting === AUTO_LANGUAGE) {
    return detectLocale(obsidianLang);
  }
  if (setting in LOCALES) {
    return setting as Locale;
  }
  return "en";
};

export const detectLocale = (obsidianLang?: string): Locale => {
  const code = (obsidianLang ?? DEFAULT_LOCALE).toLowerCase();
  if (code.startsWith("ru")) return "ru";
  if (code.startsWith("fr")) return "fr";
  if (code.startsWith("de")) return "de";
  return DEFAULT_LOCALE;
};

export const setLocale = (locale: Locale): void => {
  currentLocale = LOCALES[locale] ?? en;
};

export const t = (
  key: string,
  params?: Record<string, string | number>,
): string => {
  let str = currentLocale.strings[key] ?? en.strings[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
};

export const getWeekdayLabels = (): string[] => currentLocale.weekdayLabels;

export const getMonthLabels = (): string[] => currentLocale.monthLabels;

export const formatDisplayDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-");
  return currentLocale.dateFormat
    .replace("YYYY", y)
    .replace("MM", m)
    .replace("DD", d);
};
