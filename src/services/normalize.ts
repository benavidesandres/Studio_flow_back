import type { Actor, ConflictItem, Production, Scene, User, UserRole } from '@/types';

/* The Spring DTOs differ from the UI's model; every API response is adapted here and only here. */

type RawUser = Partial<User> & { id: number; role: UserRole };

export const normalizeUser = (raw: RawUser): User => ({
  id: raw.id,
  name: raw.name ?? '',
  email: raw.email ?? '',
  role: raw.role,
  phone: raw.phone,
  avatarUrl: raw.avatarUrl,
});

type RawActor = Partial<Actor> & { id: number };

export const normalizeActor = (raw: RawActor): Actor => ({
  id: raw.id,
  name: raw.name ?? '',
  email: raw.email ?? '',
  phone: raw.phone,
  characterName: raw.characterName,
  avatarUrl: raw.avatarUrl,
});

type RawScene = Partial<Omit<Scene, 'actors'>> & { id: number; actors?: RawActor[] };

export const normalizeScene = (raw: RawScene): Scene => {
  const actors = (raw.actors ?? []).map(normalizeActor);
  const startTime = (raw.startTime ?? '00:00').slice(0, 5);
  return {
    id: raw.id,
    productionId: raw.productionId ?? 0,
    sceneNumber: raw.sceneNumber ?? '',
    title: raw.title ?? '',
    description: raw.description,
    location: raw.location ?? '',
    shootDate: raw.shootDate ?? '',
    startTime,
    endTime: (raw.endTime ?? startTime).slice(0, 5),
    cost: Number(raw.cost ?? 0),
    status: raw.status ?? 'READY',
    actorIds: raw.actorIds ?? actors.map((actor) => actor.id),
    actors,
    allowWarnings: raw.allowWarnings,
    notes: raw.notes,
  };
};

type RawProduction = Partial<Production> & { id: number };

export const normalizeProduction = (raw: RawProduction): Production => ({
  id: raw.id,
  title: raw.title ?? '',
  description: raw.description,
  startDate: raw.startDate ?? '',
  endDate: raw.endDate ?? '',
  totalBudget: Number(raw.totalBudget ?? 0),
  spentBudget: Number(raw.spentBudget ?? 0),
  progressPercentage: raw.progressPercentage ?? 0,
  totalScenes: raw.totalScenes ?? 0,
  completedScenes: raw.completedScenes ?? 0,
  status: raw.status,
  directorName: raw.directorName,
});

type RawConflict = Omit<ConflictItem, 'availableMarginMinutes'> & {
  gapMinutes?: number;
  availableMarginMinutes?: number;
};

export const normalizeConflict = (raw: RawConflict): ConflictItem => ({
  ...raw,
  availableMarginMinutes: raw.availableMarginMinutes ?? raw.gapMinutes,
});
