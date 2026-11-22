import type { Actor, ConflictItem, ConflictValidationResponse, CreateScenePayload, Scene, ShootStatus } from '@/types';
import { checkCandidate, summarizeConflicts } from '@/lib/conflicts';
import { byCallTime } from '@/lib/status';
import { apiClient, isDemo, readWithFallback } from './api';
import { localDB } from './dataStorage';
import { normalizeConflict, normalizeScene } from './normalize';

export interface ApiConflictError {
  response?: { status: number; data: { message: string; conflicts: ConflictItem[] } };
}

/** Demo-mode twin of the backend's 409: blocking overlaps always, warnings unless acknowledged. */
const assertSchedulable = (payload: CreateScenePayload, id?: number) => {
  const conflicts = checkCandidate(localDB.getScenes(), { ...payload, id }, localDB.getActors());
  const { hasBlockingOverlap, hasLocationWarning } = summarizeConflicts(conflicts);
  if (hasBlockingOverlap || (hasLocationWarning && !payload.allowWarnings)) {
    throw { response: { status: 409, data: { message: '', conflicts } } } satisfies ApiConflictError;
  }
};

export const sceneService = {
  createScene: async (payload: CreateScenePayload): Promise<Scene> => {
    if (!isDemo()) return normalizeScene((await apiClient.post('/scenes', payload)).data);

    assertSchedulable(payload);
    const scenes = localDB.getScenes();
    const created: Scene = {
      ...payload,
      id: Math.max(0, ...scenes.map((scene) => scene.id)) + 1,
      status: payload.status ?? 'READY',
    };
    localDB.saveScenes([...scenes, created]);
    return created;
  },

  updateScene: async (id: number, payload: CreateScenePayload): Promise<Scene> => {
    if (!isDemo()) return normalizeScene((await apiClient.put(`/scenes/${id}`, payload)).data);

    assertSchedulable(payload, id);
    const scenes = localDB.getScenes();
    const current = scenes.find((scene) => scene.id === id);
    if (!current) throw new Error('Scene not found');
    const updated: Scene = { ...current, ...payload };
    localDB.saveScenes(scenes.map((scene) => (scene.id === id ? updated : scene)));
    return updated;
  },

  updateStatus: async (id: number, status: ShootStatus): Promise<void> => {
    if (!isDemo()) {
      await apiClient.patch(`/scenes/${id}/status`, null, { params: { status } });
      return;
    }
    localDB.saveScenes(localDB.getScenes().map((scene) => (scene.id === id ? { ...scene, status } : scene)));
  },

  deleteScene: async (id: number): Promise<void> => {
    if (!isDemo()) {
      await apiClient.delete(`/scenes/${id}`);
      return;
    }
    localDB.saveScenes(localDB.getScenes().filter((scene) => scene.id !== id));
  },

  /**
   * Dry-run used while the form is being filled. `scenes` and `actors` drive the local check,
   * which also covers the API being unreachable.
   */
  validateConflicts: async (
    payload: CreateScenePayload,
    id: number | undefined,
    scenes: Scene[],
    actors: Actor[]
  ): Promise<ConflictValidationResponse> => {
    const local = (pool: Scene[]) => summarizeConflicts(checkCandidate(pool, { ...payload, id }, actors));
    // Like the backend, the demo checks every production: nobody can be on two sets at once.
    if (isDemo()) return local(localDB.getScenes());

    // SceneRequest carries no id, so when editing the API reports the scene against itself.
    const fromApi = (items: ConflictItem[]) =>
      summarizeConflicts(items.map(normalizeConflict).filter((conflict) => conflict.conflictingSceneId !== id));

    try {
      // The endpoint validates the whole body, including fields the user may not have typed yet.
      const { data } = await apiClient.post('/scenes/validate-conflicts', {
        ...payload,
        sceneNumber: payload.sceneNumber || '-',
        title: payload.title || '-',
        location: payload.location || '-',
      });
      return fromApi(data);
    } catch (error) {
      // The engine reports blocking conflicts as a 409 rather than in the response body.
      const { response } = error as ApiConflictError;
      return response?.status === 409 && response.data?.conflicts ? fromApi(response.data.conflicts) : local(scenes);
    }
  },

  getScenesByActor: (actorId: number): Promise<Scene[]> =>
    readWithFallback(
      async () => (await apiClient.get(`/scenes/actor/${actorId}`)).data.map(normalizeScene).sort(byCallTime),
      () => localDB.getScenes().filter((scene) => scene.actorIds.includes(actorId)).sort(byCallTime)
    ),
};
