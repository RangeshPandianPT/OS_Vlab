import type { Page } from '@/types';



/**
 * Deserializes a base64-encoded string back into a state object.
 * Returns null on any error so callers can gracefully fall back to defaults.
 */
export function deserializeState<T>(encoded: string): T | null {
  try {
    if (!encoded) return null;
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    // Basic sanity check: must be a plain object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}



/**
 * Reads the `?page=` and `?state=` query params from the current URL.
 * Returns { page: null, encodedState: null } if absent or invalid.
 */
export function readStateFromUrl(): { page: Page | null; encodedState: string | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') as Page | null;
    const encodedState = params.get('state');
    return { page, encodedState };
  } catch {
    return { page: null, encodedState: null };
  }
}

/**
 * Updates the browser URL without triggering a navigation/reload.
 * Called on page changes so the ?page= param stays in sync.
 */
export function updateUrlPage(pageId: Page): void {
  try {
    const params = new URLSearchParams(window.location.search);
    params.set('page', pageId);
    // Remove stale state when navigating away
    params.delete('state');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  } catch {
    // Non-critical; silently ignore
  }
}
