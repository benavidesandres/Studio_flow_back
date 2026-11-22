export type UserRole = 'PRODUCER' | 'DIRECTOR' | 'CREW' | 'ACTOR';

export type ShootStatus = 'READY' | 'DELAYED' | 'PROBLEM' | 'COMPLETED';

export type ConflictType = 'ACTOR_OVERLAP' | 'WARNING_LOCATION_CONFLICT';

export type ProductionPhase = 'PRE_PRODUCTION' | 'FILMING' | 'POST_PRODUCTION' | 'WRAPPED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

export interface Actor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  characterName?: string;
  avatarUrl?: string;
}

export interface ConflictItem {
  type: ConflictType;
  actorId: number;
  actorName: string;
  conflictingSceneId?: number;
  conflictingSceneTitle?: string;
  message: string;
  availableMarginMinutes?: number;
}

export interface ConflictValidationResponse {
  hasConflicts: boolean;
  hasBlockingOverlap: boolean;
  hasLocationWarning: boolean;
  conflicts: ConflictItem[];
}

export interface Scene {
  id: number;
  productionId: number;
  sceneNumber: string;
  title: string;
  description?: string;
  location: string;
  /** YYYY-MM-DD, or an empty string while the scene is unscheduled. */
  shootDate: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  cost: number;
  status: ShootStatus;
  actorIds: number[];
  actors?: Actor[];
  allowWarnings?: boolean;
  notes?: string;
}

export interface Production {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spentBudget: number;
  progressPercentage: number;
  totalScenes: number;
  completedScenes: number;
  status?: ProductionPhase;
  directorName?: string;
}

export interface CreateScenePayload {
  productionId: number;
  sceneNumber: string;
  title: string;
  location: string;
  shootDate: string;
  startTime: string;
  endTime: string;
  cost: number;
  actorIds: number[];
  allowWarnings: boolean;
  status?: ShootStatus;
  notes?: string;
}

export interface CreateProductionPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
}
