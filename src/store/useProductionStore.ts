import { create } from 'zustand';
import type { Actor, Production, Scene, ShootStatus } from '@/types';
import { productionService } from '@/services/productionService';
import { sceneService } from '@/services/sceneService';
import { authService } from '@/services/authService';

export interface SceneFormRequest {
  scene?: Scene;
  date?: string;
}

interface ProductionState {
  production: Production | null;
  scenes: Scene[];
  actors: Actor[];
  loading: boolean;
  failed: boolean;
  activeSceneId: number | null;
  sceneForm: SceneFormRequest | null;
  load: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  changeStatus: (sceneId: number, status: ShootStatus) => Promise<boolean>;
  deleteScene: (sceneId: number) => Promise<void>;
  openScene: (sceneId: number | null) => void;
  openSceneForm: (request: SceneFormRequest | null) => void;
}

// Guards against a slow response from a previously opened production overwriting the current one.
let latestRequest = 0;

const fetchProduction = async (id: number) => {
  const [production, scenes, actors] = await Promise.all([
    productionService.getProductionById(id),
    productionService.getScenes(id),
    authService.getActors(),
  ]);
  return { production: production ?? null, scenes, actors };
};

export const useProductionStore = create<ProductionState>((set, get) => ({
  production: null,
  scenes: [],
  actors: [],
  loading: true,
  failed: false,
  activeSceneId: null,
  sceneForm: null,

  load: async (id) => {
    const request = ++latestRequest;
    set({ loading: get().production?.id !== id, failed: false, activeSceneId: null, sceneForm: null });
    try {
      const data = await fetchProduction(id);
      if (request === latestRequest) set({ ...data, loading: false, failed: !data.production });
    } catch {
      if (request === latestRequest) set({ production: null, scenes: [], loading: false, failed: true });
    }
  },

  // Runs after a write that already succeeded: if re-reading fails, the screen keeps what it has
  // rather than reporting the write as failed.
  refresh: async () => {
    const id = get().production?.id;
    if (!id) return;
    const request = ++latestRequest;
    try {
      const data = await fetchProduction(id);
      if (request === latestRequest) set(data);
    } catch {
      // Stale until the next load; the write itself went through.
    }
  },

  changeStatus: async (sceneId, status) => {
    const previous = get().scenes;
    set({ scenes: previous.map((scene) => (scene.id === sceneId ? { ...scene, status } : scene)) });
    try {
      await sceneService.updateStatus(sceneId, status);
    } catch {
      set({ scenes: previous });
      return false;
    }
    await get().refresh();
    return true;
  },

  deleteScene: async (sceneId) => {
    await sceneService.deleteScene(sceneId);
    set({ activeSceneId: null });
    await get().refresh();
  },

  openScene: (activeSceneId) => set({ activeSceneId }),
  openSceneForm: (sceneForm) => set({ sceneForm }),
}));
