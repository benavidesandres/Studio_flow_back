import { useMemo } from 'react';
import type { Scene } from '@/types';
import type { ConflictPair } from '@/lib/conflicts';
import { byCallTime } from '@/lib/status';
import { useProductionStore } from '@/store/useProductionStore';
import { useConflictPairs, usePermissions } from '@/components/scenes/useScenePermissions';

export const BUDGET_WARNING_PCT = 85;

export type AttentionItem =
  | { kind: 'conflict'; key: string; critical: boolean; pair: ConflictPair }
  | { kind: 'scene'; key: string; critical: boolean; scene: Scene }
  | { kind: 'budget'; key: string; critical: boolean; percent: number };

/** Everything that needs a producer's attention right now, most urgent first. */
export function useAttentionItems(): AttentionItem[] {
  const production = useProductionStore((state) => state.production);
  const scenes = useProductionStore((state) => state.scenes);
  const pairs = useConflictPairs();
  const { viewBudget, viewConflicts } = usePermissions();

  return useMemo(() => {
    const items: AttentionItem[] = [];

    if (viewConflicts) {
      pairs.forEach((pair) => items.push({ kind: 'conflict', key: pair.key, critical: pair.type === 'ACTOR_OVERLAP', pair }));
    }

    [...scenes]
      .filter((scene) => scene.status === 'PROBLEM' || scene.status === 'DELAYED')
      .sort(byCallTime)
      .forEach((scene) => items.push({ kind: 'scene', key: `scene-${scene.id}`, critical: scene.status === 'PROBLEM', scene }));

    if (viewBudget && production && production.totalBudget > 0) {
      const percent = Math.round((production.spentBudget / production.totalBudget) * 100);
      if (percent >= BUDGET_WARNING_PCT) items.push({ kind: 'budget', key: 'budget', critical: percent > 100, percent });
    }

    return items.sort((a, b) => Number(b.critical) - Number(a.critical));
  }, [pairs, scenes, production, viewBudget, viewConflicts]);
}
