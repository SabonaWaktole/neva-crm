import { useEffect, useState } from 'react';

/**
 * Tracks whether a CSS media query currently matches.
 *
 * Used where a layout difference is structural rather than cosmetic — e.g.
 * DataTable renders either a <table> or a stacked card list, never both, so
 * row content is not duplicated into the DOM and accessibility tree.
 *
 * Environments without `matchMedia` (SSR, jsdom) fall back to `defaultValue`,
 * so callers can choose which branch is the safe one to render blind.
 */
export const useMediaQuery = (query: string, defaultValue = false): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Sync immediately in case the query changed between render and effect.
    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

/**
 * Matches the `768px` tablet breakpoint used across the app's CSS modules.
 * Defaults to `true` so environments without `matchMedia` render the semantic
 * table rather than the stacked card fallback.
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)', true);
