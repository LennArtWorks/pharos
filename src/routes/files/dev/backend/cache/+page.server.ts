import { getMetaCacheStats, clearAllMetaCache } from '$lib/server/cache';
import { getUserCacheStats, clearAllUserCache } from '$lib/server/auth/userCache';

export const load = async () => {
  return {
    metaCache: getMetaCacheStats(),
    userCache: getUserCacheStats()
  };
};

export const actions = {
  flushMeta: async () => {
    clearAllMetaCache();
    return { success: true, message: 'File System Cache flushed.' };
  },
  flushUsers: async () => {
    clearAllUserCache();
    return { success: true, message: 'User Profile Cache flushed.' };
  }
};