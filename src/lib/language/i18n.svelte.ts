import { translations, type Language, type TranslationKey } from './i18n';
import { browser } from '$app/environment';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

const LANG_KEY = `${GLOBAL_SETTINGS.APP_INFO.COOKIE_PREFIX}_lang`;

class LocaleState {
  // 1. Initial State: Check LocalStorage -> then Browser Lang -> then Default to English
  current = $state<Language>(this.getInitialLang());

  private getInitialLang(): Language {
    if (!browser) return 'en';

    const saved = localStorage.getItem(LANG_KEY) as Language;
    if (saved && translations[saved]) return saved;

    const browserLang = navigator.language.split('-')[0] as Language;
    return translations[browserLang] ? browserLang : 'en';
  }

  // 2. Setter that also saves to disk
  setLanguage(lang: Language) {
    this.current = lang;
    if (browser) {
      localStorage.setItem(LANG_KEY, lang);
    }
  }

  translate(key: TranslationKey): string {
    return translations[this.current][key] || translations['en'][key] || key;
  }
}

export const locale = new LocaleState();
export const t = (key: TranslationKey) => locale.translate(key);