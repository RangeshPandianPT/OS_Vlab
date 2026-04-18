import { useMemo } from 'react';
import type { Page } from '@/types';
import { readStateFromUrl, deserializeState } from '@/utils/permalinkUtils';

/**
 * Reads the URL query params on first render and returns an initial state
 * merged with the provided defaults. If the URL state is absent, invalid, or
 * belongs to a different page, the defaults are returned unchanged.
 *
 * Usage:
 *   const initialState = usePermalinkState('cpu-scheduling', { algorithm: 'FCFS', ... });
 *   const [algorithm, setAlgorithm] = useState(initialState.algorithm);
 */
export function usePermalinkState<T extends object>(pageId: Page, defaultState: T): T {
  return useMemo(() => {
    const { page, encodedState } = readStateFromUrl();

    // Only apply if the URL targets this specific page
    if (!page || page !== pageId || !encodedState) {
      return defaultState;
    }

    const urlState = deserializeState<Partial<T>>(encodedState);
    if (!urlState) {
      return defaultState;
    }

    // Merge: URL values take precedence, but only for keys that exist in defaultState
    // This prevents unknown/malicious keys from polluting state
    const merged = { ...defaultState };
    for (const key of Object.keys(defaultState) as Array<keyof T>) {
      if (key in urlState && urlState[key] !== undefined) {
        (merged as any)[key] = urlState[key];
      }
    }

    return merged;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty deps — only run once on mount
}
