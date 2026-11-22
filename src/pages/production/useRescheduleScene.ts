import type { Scene } from '@/types';
import { sceneService, type ApiConflictError } from '@/services/sceneService';
import { useProductionStore } from '@/store/useProductionStore';
import { toast } from '@/components/ui/toastStore';
import { useT } from '@/i18n/useT';

/**
 * Moves a dragged scene to another day. If the conflict engine rejects the move, the form opens
 * on the new date so the clash can be seen and resolved rather than the drag silently failing.
 */
export function useRescheduleScene() {
  const { t } = useT();
  const refresh = useProductionStore((state) => state.refresh);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);

  return async (scene: Scene, shootDate: string) => {
    if (scene.shootDate === shootDate) return;
    try {
      await sceneService.updateScene(scene.id, {
        productionId: scene.productionId,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        location: scene.location,
        shootDate,
        startTime: scene.startTime,
        endTime: scene.endTime,
        cost: scene.cost,
        actorIds: scene.actorIds,
        allowWarnings: false,
        status: scene.status,
        notes: scene.notes,
      });
      await refresh();
      toast(t('calendar.moved', { number: scene.sceneNumber }));
    } catch (error) {
      if ((error as ApiConflictError).response?.status === 409) {
        openSceneForm({ scene: { ...scene, shootDate } });
      } else {
        toast(t('common.saveFailed'), 'error');
      }
    }
  };
}
