import { addDays, parseISO } from 'date-fns';
import { toISO, toMinutes } from './format';

export interface Slot {
  shootDate: string;
  startTime: string;
  endTime: string;
}

/** Time between scenes for resetting the set or moving the unit. */
export const SCENE_GAP_MINUTES = 15;

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Lays scenes out in script order, one after another within the working day, and moves to the next day
 * when a scene no longer fits. A scene longer than the whole day gets a day of its own, cut at its end.
 */
export function layoutScenes(durations: number[], startDate: string, dayStart: string, dayEnd: string): Slot[] {
  const open = toMinutes(dayStart);
  const close = toMinutes(dayEnd);
  let day = parseISO(startDate);
  let cursor = open;

  return durations.map((minutes) => {
    if (cursor > open && cursor + minutes > close) {
      day = addDays(day, 1);
      cursor = open;
    }
    const start = cursor;
    const end = Math.min(start + minutes, close);
    cursor = end + SCENE_GAP_MINUTES;
    return { shootDate: toISO(day), startTime: clock(start), endTime: clock(end) };
  });
}
