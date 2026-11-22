import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { useAppStore } from './useAppStore';

const DEMO_KEY = 'sf_demo_role';
const SESSION_KEY = 'sf_session';

const DEMO_USER: User = {
  id: 1,
  name: 'Laura Méndez',
  email: 'laura@studioflow.demo',
  role: 'PRODUCER',
};

interface Session {
  token: string;
  user: User;
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** Without storage a session simply won't survive a reload. */
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Nothing else to do.
  }
};

const readSession = (): Session | null => {
  try {
    return JSON.parse(read(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  /** True while a saved session is being checked against the server on startup. */
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  startDemo: (role?: UserRole) => void;
  /** Demo only: real roles come from the server and cannot be changed from the client. */
  setDemoRole: (role: UserRole) => void;
  finishRestoring: (user?: User) => void;
}

const demoRole = read(DEMO_KEY) as UserRole | null;
const saved = demoRole ? null : readSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: demoRole ? { ...DEMO_USER, role: demoRole } : (saved?.user ?? null),
  token: demoRole ? 'demo' : (saved?.token ?? null),
  isAuthenticated: !!demoRole || !!saved,
  isDemoMode: !!demoRole,
  isLoading: !!saved,

  login: (user, token) => {
    write(SESSION_KEY, JSON.stringify({ token, user }));
    set({ user, token, isAuthenticated: true, isDemoMode: false });
  },

  logout: () => {
    write(DEMO_KEY, null);
    write(SESSION_KEY, null);
    useAppStore.getState().setUsingSampleData(false);
    set({ user: null, token: null, isAuthenticated: false, isDemoMode: false, isLoading: false });
  },

  startDemo: (role = 'PRODUCER') => {
    write(DEMO_KEY, role);
    set({ isDemoMode: true, user: { ...DEMO_USER, role }, token: 'demo', isAuthenticated: true });
  },

  setDemoRole: (role) => {
    write(DEMO_KEY, role);
    set((state) => (state.user ? { user: { ...state.user, role } } : state));
  },

  finishRestoring: (user) => {
    const { token } = get();
    if (user && token) {
      write(SESSION_KEY, JSON.stringify({ token, user }));
      set({ user });
    }
    set({ isLoading: false });
  },
}));
