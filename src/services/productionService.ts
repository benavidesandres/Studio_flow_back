import type { CreateProductionPayload, Production, Scene } from '@/types';
import { apiClient, isDemo, readWithFallback } from './api';
import { localDB } from './dataStorage';
import { normalizeProduction, normalizeScene } from './normalize';
import { byCallTime } from '@/lib/status';

export const productionService = {
  getProductions: (): Promise<Production[]> =>
    readWithFallback(
      async () => (await apiClient.get('/productions')).data.map(normalizeProduction),
      () => localDB.getProductions()
    ),

  getProductionById: (id: number): Promise<Production | undefined> =>
    readWithFallback(
      async () => normalizeProduction((await apiClient.get(`/productions/${id}`)).data),
      () => localDB.getProductions().find((production) => production.id === id)
    ),

  getScenes: (productionId: number): Promise<Scene[]> =>
    readWithFallback(
      async () => (await apiClient.get(`/productions/${productionId}/scenes`)).data.map(normalizeScene).sort(byCallTime),
      () => localDB.getScenes().filter((scene) => scene.productionId === productionId).sort(byCallTime)
    ),

  createProduction: async (payload: CreateProductionPayload): Promise<Production> => {
    if (!isDemo()) return normalizeProduction((await apiClient.post('/productions', payload)).data);

    const productions = localDB.getProductions();
    const created: Production = {
      ...payload,
      id: Math.max(0, ...productions.map((production) => production.id)) + 1,
      spentBudget: 0,
      progressPercentage: 0,
      totalScenes: 0,
      completedScenes: 0,
      status: 'PRE_PRODUCTION',
    };
    localDB.saveProductions([created, ...productions]);
    return created;
  },
};
