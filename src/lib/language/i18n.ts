// src/lib/i18n.ts

const en = {
  dashboard: "Dashboard",
  iconOverview: "Icon Overview",
  back: "Back",
  settings: "Settings",
  template: "Template"
} as const;

// Create a type for the keys
export type TranslationKey = keyof typeof en;

// Force 'de' to have the same keys, but allow different string values
const de: Record<TranslationKey, string> = {
  dashboard: "Übersicht",
  iconOverview: "Icon-Übersicht",
  back: "Zurück",
  settings: "Einstellungen",
  template: "Vorlage"
};

export const translations = { en, de } as const;
export type Language = keyof typeof translations;