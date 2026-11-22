import { useAppStore } from '@/store/useAppStore';
import { translations, type TranslationKey } from './translations';

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export const useT = () => {
  const language = useAppStore((state) => state.language);

  const t: Translate = (key, vars) => {
    let text: string = translations[language][key];
    Object.entries(vars ?? {}).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
    return text;
  };

  return { t, language };
};
