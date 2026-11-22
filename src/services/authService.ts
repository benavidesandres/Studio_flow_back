import type { Actor, User, UserRole } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient, readWithFallback } from './api';
import { localDB } from './dataStorage';
import { normalizeActor, normalizeUser } from './normalize';

const toSession = (data: { token: string; user: Parameters<typeof normalizeUser>[0] }) => ({
  token: data.token,
  user: normalizeUser(data.user),
});

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> =>
    toSession((await apiClient.post('/auth/login', { email, password })).data),

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ token: string; user: User }> => toSession((await apiClient.post('/auth/register', payload)).data),

  /**
   * Confirms the saved session and refreshes the profile. An invalid token is cleared by the 401
   * interceptor; if the server is merely unreachable the saved session is kept.
   */
  restoreSession: async (): Promise<void> => {
    const { token, isDemoMode, finishRestoring } = useAuthStore.getState();
    if (!token || isDemoMode) return;
    try {
      finishRestoring(normalizeUser((await apiClient.get('/auth/me')).data));
    } catch {
      finishRestoring();
    }
  },

  getActors: (): Promise<Actor[]> =>
    readWithFallback(
      async () => (await apiClient.get('/auth/actors')).data.map(normalizeActor),
      () => localDB.getActors()
    ),
};
