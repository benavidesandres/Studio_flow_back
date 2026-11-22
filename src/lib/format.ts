import { addDays, format, isValid, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import type { AppLanguage } from '@/store/useAppStore';

// Local-time on purpose: toISOString() would roll over to tomorrow every evening in the Americas.
export const toISO = (date: Date) => format(date, 'yyyy-MM-dd');
export const todayISO = () => toISO(new Date());
export const isoFromToday = (days: number) => toISO(addDays(new Date(), days));

export const dateLocale = (language: AppLanguage) => (language === 'es' ? es : enUS);

export const formatDate = (iso: string, language: AppLanguage, pattern = 'EEE d MMM') => {
  if (!iso) return '—';
  const date = parseISO(iso);
  return isValid(date) ? format(date, pattern, { locale: dateLocale(language) }) : iso;
};

export const formatRange = (start: string, end: string, language: AppLanguage) =>
  `${formatDate(start, language, 'd MMM')} – ${formatDate(end, language, 'd MMM yyyy')}`;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const money = (value: number) => currency.format(value);
export const moneyCompact = (value: number) => compactCurrency.format(value);

export const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export const sceneDuration = (scene: { startTime: string; endTime: string }) =>
  Math.max(0, toMinutes(scene.endTime) - toMinutes(scene.startTime));
