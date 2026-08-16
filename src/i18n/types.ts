export type Locale = "en" | "ru" | "fr" | "de";

export interface LocaleData {
  strings: Record<string, string>;
  weekdayLabels: string[];
  monthLabels: string[];
  dateFormat: string;
}
