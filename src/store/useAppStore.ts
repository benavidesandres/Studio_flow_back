import { create } from 'zustand';

export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'es' | 'en';

interface AppState {
  theme: AppTheme;
  language: AppLanguage;
  /** True when the API could not be reached and the screen is showing sample data instead. */
  usingSampleData: boolean;
  toggleTheme: () => void;
  setLanguage: (language: AppLanguage) => void;
  setUsingSampleData: (value: boolean) => void;
}

const readSetting = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const saved = localStorage.getItem(key) as T | null;
    return saved && allowed.includes(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
};

const writeSetting = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are a convenience: the app keeps working without storage.
  }
};

const applyTheme = (theme: AppTheme) => {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
};

const initialTheme = readSetting<AppTheme>('sf_theme', ['dark', 'light'], 'dark');
const initialLanguage = readSetting<AppLanguage>('sf_lang', ['es', 'en'], 'es');

applyTheme(initialTheme);
document.documentElement.lang = initialLanguage;

export const useAppStore = create<AppState>((set, get) => ({
  theme: initialTheme,
  language: initialLanguage,
  usingSampleData: false,

  toggleTheme: () => {
    const theme: AppTheme = get().theme === 'dark' ? 'light' : 'dark';
    writeSetting('sf_theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  setLanguage: (language) => {
    writeSetting('sf_lang', language);
    document.documentElement.lang = language;
    set({ language });
  },

  setUsingSampleData: (usingSampleData) => {
    if (get().usingSampleData !== usingSampleData) set({ usingSampleData });
  },
}));
