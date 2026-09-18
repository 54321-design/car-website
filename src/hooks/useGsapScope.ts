import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';

type ScopeFn = (ctx: { self: gsap.Context; scope: HTMLElement }) => void;

/**
 * Scoped GSAP setup with guaranteed teardown.
 *
 * `gsap.context` collects every tween, timeline and ScrollTrigger created inside
 * the callback and reverts them together, which is what keeps pinned sections
 * from leaking spacers across React 19 Strict Mode's double-invoked effects.
 *
 * Returns the scope ref to spread onto the section root; selector strings inside
 * the callback resolve against that element only.
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  setup: ScopeFn,
  deps: DependencyList = [],
): RefObject<T | null> {
  const scopeRef = useRef<T>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context((self) => setup({ self, scope }), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}
