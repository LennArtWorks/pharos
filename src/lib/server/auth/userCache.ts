import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  color?: string; // Adding color since we use it in the UI
}

const cache = new Map<string, { data: UserProfile; expires: number }>();

export function getCachedUser(accountId: string): UserProfile | null {
  const entry = cache.get(accountId);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  return null;
}

export function setCachedUser(accountId: string, data: UserProfile) {
  cache.set(accountId, {
    data,
    expires: Date.now() + GLOBAL_SETTINGS.SECURITY.PROFILE_CACHE_TTL_MS
  });
}

export function clearCachedUser(accountId: string) {
  cache.delete(accountId);
}