import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { hasPermission, NOTLOGGEDIN_ROLE } from '$lib/config/permissions';

/**
 * A reactive Svelte store that checks permissions against the current user's session.
 * Usage in components: $can('files.edit')
 */
export const can = derived(page, ($page) => {
  return (requiredFlag: string) => {
    const role = $page.data.user?.role || NOTLOGGEDIN_ROLE;
    // Fallback just in case, though layout.server.ts guarantees it now
    const activeRoles = $page.data.activeRoles || {};

    return hasPermission(role, requiredFlag, activeRoles);
  };
});