import { page } from '$app/state';
import { hasPermission, SETUP_ROLES } from '$lib/config/permissions';

/**
 * A reactive permission checker.
 * Usage in Svelte 5 components: can('files.edit')
 */
export function can(requiredFlag: string) {
  const role = page.data?.user?.role || SETUP_ROLES.GUEST;
  const activeRoles = page.data?.activeRoles || {};

  return hasPermission(role, requiredFlag, activeRoles);
}