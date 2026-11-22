import type { Actor, ConflictItem, ConflictType, Scene } from '@/types';
import { byCallTime } from './status';
import { toMinutes } from './format';

/** Must stay aligned with the minimum travel time enforced by the Spring conflict engine. */
export const MIN_TRAVEL_MINUTES = 45;

type Slot = Pick<Scene, 'shootDate' | 'startTime' | 'endTime' | 'location'>;

const sameLocation = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Classifies two same-day slots that share an actor; null means there is nothing to report. */
const classify = (a: Slot, b: Slot): { type: ConflictType; gapMinutes?: number } | null => {
  const startA = toMinutes(a.startTime);
  const endA = toMinutes(a.endTime);
  const startB = toMinutes(b.startTime);
  const endB = toMinutes(b.endTime);

  if (startA < endB && endA > startB) return { type: 'ACTOR_OVERLAP' };
  if (sameLocation(a.location, b.location)) return null;

  const gapMinutes = startA >= endB ? startA - endB : startB - endA;
  return gapMinutes < MIN_TRAVEL_MINUTES ? { type: 'WARNING_LOCATION_CONFLICT', gapMinutes } : null;
};

const actorName = (actorId: number, actors: Actor[], scene?: Scene) =>
  actors.find((actor) => actor.id === actorId)?.name ??
  scene?.actors?.find((actor) => actor.id === actorId)?.name ??
  `#${actorId}`;

/** Dry-run for a scene being edited: what would it clash with if it were saved? */
export function checkCandidate(
  scenes: Scene[],
  candidate: Slot & { id?: number; actorIds: number[] },
  actors: Actor[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  for (const scene of scenes) {
    if (scene.id === candidate.id || scene.shootDate !== candidate.shootDate) continue;

    const result = classify(candidate, scene);
    if (!result) continue;

    for (const actorId of candidate.actorIds.filter((id) => scene.actorIds.includes(id))) {
      conflicts.push({
        type: result.type,
        actorId,
        actorName: actorName(actorId, actors, scene),
        conflictingSceneId: scene.id,
        conflictingSceneTitle: `${scene.sceneNumber} · ${scene.title}`,
        message: '',
        availableMarginMinutes: result.gapMinutes,
      });
    }
  }

  return conflicts;
}

export interface ConflictPair {
  key: string;
  type: ConflictType;
  actorId: number;
  actorName: string;
  first: Scene;
  second: Scene;
  gapMinutes?: number;
}

/** Every clash in the schedule, blocking ones first. Pairs already shot are history, not problems. */
export function findConflictPairs(scenes: Scene[], actors: Actor[]): ConflictPair[] {
  const scheduled = scenes.filter((scene) => scene.shootDate).sort(byCallTime);
  const pairs: ConflictPair[] = [];

  scheduled.forEach((first, index) => {
    for (const second of scheduled.slice(index + 1)) {
      if (second.shootDate !== first.shootDate) break;
      if (first.status === 'COMPLETED' && second.status === 'COMPLETED') continue;

      const result = classify(first, second);
      if (!result) continue;

      for (const actorId of first.actorIds.filter((id) => second.actorIds.includes(id))) {
        pairs.push({
          key: `${result.type}-${actorId}-${first.id}-${second.id}`,
          actorId,
          actorName: actorName(actorId, actors, first),
          first,
          second,
          ...result,
        });
      }
    }
  });

  return pairs.sort((a, b) => Number(b.type === 'ACTOR_OVERLAP') - Number(a.type === 'ACTOR_OVERLAP'));
}

export const summarizeConflicts = (conflicts: ConflictItem[]) => ({
  hasConflicts: conflicts.length > 0,
  hasBlockingOverlap: conflicts.some((conflict) => conflict.type === 'ACTOR_OVERLAP'),
  hasLocationWarning: conflicts.some((conflict) => conflict.type === 'WARNING_LOCATION_CONFLICT'),
  conflicts,
});
