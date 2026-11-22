import type { UserRole } from '@/types';

export const permissionsFor = (role: UserRole) => ({
  editScenes: role === 'PRODUCER' || role === 'DIRECTOR',
  deleteScenes: role === 'PRODUCER',
  createProductions: role === 'PRODUCER',
  viewBudget: role === 'PRODUCER' || role === 'DIRECTOR',
  viewConflicts: role === 'PRODUCER' || role === 'DIRECTOR',
});
