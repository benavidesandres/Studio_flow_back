import type { Actor, Production, Scene } from '@/types';
import { todayISO } from '@/lib/format';
import { buildSampleData, SAMPLE_ACTORS } from './mockData';

const STORAGE_KEY = 'studioflow_demo_v2';

interface Snapshot {
  day: string;
  productions: Production[];
  scenes: Scene[];
}

const save = (snapshot: Snapshot) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Without storage the demo still works, it just resets on reload.
  }
};

let memory: Snapshot | null = null;

/** The sample schedule is relative to today, so it is reseeded each new day to stay current. */
const load = (): Snapshot => {
  const today = todayISO();
  if (memory?.day === today) return memory;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Snapshot | null;
    if (stored?.day === today) return (memory = stored);
  } catch {
    // Corrupt or blocked storage falls through to a fresh seed.
  }
  memory = { day: today, ...buildSampleData() };
  save(memory);
  return memory;
};

const withMetrics = (production: Production, scenes: Scene[]): Production => {
  const own = scenes.filter((scene) => scene.productionId === production.id);
  const completedScenes = own.filter((scene) => scene.status === 'COMPLETED').length;
  return {
    ...production,
    totalScenes: own.length,
    completedScenes,
    spentBudget: own.reduce((sum, scene) => sum + scene.cost, 0),
    progressPercentage: own.length ? Math.round((completedScenes / own.length) * 100) : 0,
  };
};

const withActors = (scene: Scene): Scene => ({
  ...scene,
  actors: SAMPLE_ACTORS.filter((actor) => scene.actorIds.includes(actor.id)),
});

export const localDB = {
  getProductions: (): Production[] => {
    const { productions, scenes } = load();
    return productions.map((production) => withMetrics(production, scenes));
  },

  saveProductions: (productions: Production[]) => {
    memory = { ...load(), productions };
    save(memory);
  },

  getScenes: (): Scene[] => load().scenes.map(withActors),

  saveScenes: (scenes: Scene[]) => {
    memory = { ...load(), scenes };
    save(memory);
  },

  getActors: (): Actor[] => SAMPLE_ACTORS,
};
