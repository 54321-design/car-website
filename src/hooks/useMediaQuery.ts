import { useSyncExternalStore } from 'react';

const subscribe = (query: string) => (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Layout switch used to swap horizontal scroll for stacked panels. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
