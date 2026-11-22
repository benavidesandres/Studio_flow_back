import axios, { isAxiosError, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Render's free plan sleeps the backend when idle and takes up to a minute to wake it.
  timeout: 70_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token ends the session; on /auth/login a 401 just means wrong credentials.
apiClient.interceptors.response.use(undefined, (error: AxiosError) => {
  if (error.response?.status === 401 && error.config?.url !== '/auth/login') useAuthStore.getState().logout();
  return Promise.reject(error);
});

export const isDemo = () => useAuthStore.getState().isDemoMode;

/** No response at all (server down, network, timeout), as opposed to the server answering with an error. */
const isUnreachable = (error: unknown) => isAxiosError(error) && !error.response;

/**
 * Reads from the API and falls back to sample data only when the server can't be reached. The
 * fallback is flagged in the app store so the shell can say so: sample data must never pass for
 * the real schedule. Real answers (404, 403, 500…) are rethrown so the screen can report them.
 */
export async function readWithFallback<T>(remote: () => Promise<T>, sample: () => T): Promise<T> {
  if (isDemo()) return sample();
  const { setUsingSampleData } = useAppStore.getState();
  try {
    const value = await remote();
    setUsingSampleData(false);
    return value;
  } catch (error) {
    if (!isUnreachable(error)) throw error;
    if (useAuthStore.getState().isAuthenticated) setUsingSampleData(true);
    return sample();
  }
}
