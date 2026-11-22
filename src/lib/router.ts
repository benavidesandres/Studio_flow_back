import { useSyncExternalStore } from 'react';

export const PRODUCTION_VIEWS = [
  'overview',
  'calendar',
  'scenes',
  'cast',
  'locations',
  'budget',
  'conflicts',
] as const;

export type ProductionView = (typeof PRODUCTION_VIEWS)[number];

export type Route =
  | { name: 'productions' }
  | { name: 'my-schedule' }
  | { name: 'production'; id: number; view: ProductionView };

const parse = (hash: string): Route => {
  const [, first, second, third] = hash.replace(/^#/, '').split('/');
  if (first === 'my-schedule') return { name: 'my-schedule' };
  if (first === 'p' && Number(second) > 0) {
    const view = PRODUCTION_VIEWS.find((candidate) => candidate === third) ?? 'overview';
    return { name: 'production', id: Number(second), view };
  }
  return { name: 'productions' };
};

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
};

const getHash = () => window.location.hash;

export const useRoute = () => parse(useSyncExternalStore(subscribe, getHash));

export const productionPath = (id: number, view: ProductionView = 'overview') => `#/p/${id}/${view}`;

export const navigate = (path: string) => {
  window.location.hash = path;
};
