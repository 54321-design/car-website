/**
 * Shared, eased pointer position in normalised -1..1 space.
 *
 * Written once per frame by `usePointerField`. Canvas layers read this object
 * directly instead of calling `getComputedStyle` for `--mx`, which would force a
 * style recalculation on every animation frame.
 */
export const pointer = { x: 0, y: 0 };
