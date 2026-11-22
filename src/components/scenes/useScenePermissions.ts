import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { findConflictPairs } from '@/lib/conflicts';
import { permissionsFor } from '@/lib/permissions';
import { toast } from '@/components/ui/toastStore';
import { useT } from '@/i18n/useT';
import type { ShootStatus } from '@/types';

export const usePermissions = () => {
  const role = useAuthStore((state) => state.user?.role ?? 'CREW');
  return useMemo(() => permissionsFor(role), [role]);
};

export const useConflictPairs = () => {
  const scenes = useProductionStore((state) => state.scenes);
  const actors = useProductionStore((state) => state.actors);
  return useMemo(() => findConflictPairs(scenes, actors), [scenes, actors]);
};

/** Status change with the failure toast every surface needs; undefined for read-only roles. */
export const useStatusChanger = () => {
  const { t } = useT();
  const { editScenes } = usePermissions();
  const changeStatus = useProductionStore((state) => state.changeStatus);

  if (!editScenes) return undefined;
  return async (sceneId: number, status: ShootStatus) => {
    if (!(await changeStatus(sceneId, status))) toast(t('status.changeFailed'), 'error');
  };
};
