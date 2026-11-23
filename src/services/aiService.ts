import { isAxiosError } from 'axios';
import { apiClient, isDemo } from './api';

export type SceneSetting = 'INT' | 'EXT' | 'INT/EXT';

export interface BreakdownScene {
  sceneNumber: string;
  title: string;
  location: string;
  setting: SceneSetting;
  /** DÍA, NOCHE, AMANECER, ATARDECER o CONTINUO. */
  timeOfDay: string;
  characters: string[];
  estimatedMinutes: number;
  summary?: string | null;
}

export interface ScriptBreakdown {
  scenes: BreakdownScene[];
  characters: string[];
  locations: string[];
}

/** Same limit as the backend (studioflow.ai.max-script-chars), so the user hears about it before sending. */
export const MAX_SCRIPT_CHARS = 20_000;

/** The backend's explanation when there is one (too long, rate limit, AI not configured…). */
export const apiErrorMessage = (error: unknown): string | undefined => {
  if (!isAxiosError(error)) return undefined;
  const message = (error.response?.data as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' && message.trim() ? message : undefined;
};

// --- Demo: a plain parser of scene headings, so the flow can be tried without a server or AI ---

const HEADING = /^\s*(\d+[A-Z]?)?[.)\s-]*\b(INT\.?\/EXT|EXT\.?\/INT|I\/E|INT|EXT)\b\.?\s*(.+?)\s*$/i;
const TIMES: Record<string, string> = {
  DIA: 'DÍA', DÍA: 'DÍA', DAY: 'DÍA', NOCHE: 'NOCHE', NIGHT: 'NOCHE', AMANECER: 'AMANECER', DAWN: 'AMANECER',
  ATARDECER: 'ATARDECER', DUSK: 'ATARDECER', OCASO: 'ATARDECER', CONTINUO: 'CONTINUO', CONTINUOUS: 'CONTINUO',
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index > 0 && /^(de|del|la|las|el|los|y|a|al|en|of|the|and)$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');

/** A character cue: a short line in capitals, minus "(V.O.)", "(CONT'D)" and an age like "(40)". */
const cueName = (line: string) => {
  const name = line.replace(/\(.*?\)/g, '').trim();
  if (!name || name.length > 30 || name !== name.toUpperCase() || !/\p{Lu}/u.test(name) || /[.!?:]$/.test(name)) return null;
  return titleCase(name);
};

export function parseScriptHeadings(script: string): ScriptBreakdown {
  const scenes: BreakdownScene[] = [];
  let lines = 0;
  const close = () => {
    const last = scenes.at(-1);
    // About a page (≈55 lines) per hour of shooting, as the AI is told.
    if (last) last.estimatedMinutes = Math.max(15, Math.round((lines / 55) * 60 / 5) * 5);
    lines = 0;
  };

  for (const raw of script.split(/\r?\n/)) {
    const heading = raw.match(HEADING);
    if (heading && raw.trim() === raw.trim().toUpperCase()) {
      close();
      const [place, time = ''] = heading[3].split(/\s+[-–—]\s+/);
      const setting = heading[2].toUpperCase().startsWith('EXT') ? 'EXT' : 'INT';
      scenes.push({
        sceneNumber: heading[1] ?? String(scenes.length + 1),
        title: titleCase(place.trim()),
        location: titleCase(place.trim()),
        setting: /\//.test(heading[2]) ? 'INT/EXT' : setting,
        timeOfDay: TIMES[time.trim().toUpperCase()] ?? 'DÍA',
        characters: [],
        estimatedMinutes: 15,
        summary: null,
      });
      continue;
    }
    const scene = scenes.at(-1);
    if (!scene || !raw.trim()) continue;
    lines++;
    const name = cueName(raw);
    if (name && !scene.characters.includes(name)) scene.characters.push(name);
  }
  close();

  return {
    scenes,
    characters: [...new Set(scenes.flatMap((scene) => scene.characters))],
    locations: [...new Set(scenes.map((scene) => scene.location))],
  };
}

export const aiService = {
  breakdownScript: async (script: string): Promise<ScriptBreakdown> => {
    if (isDemo()) return parseScriptHeadings(script);
    // Waking Render (up to a minute) plus the model's own time.
    const { data } = await apiClient.post<ScriptBreakdown>('/ai/script-breakdown', { script }, { timeout: 150_000 });
    return data;
  },
};
