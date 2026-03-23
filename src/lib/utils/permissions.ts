import { page } from '$app/state';
import { hasPermission, SETUP_ROLES } from '$lib/config/permissions';

// Shared Context Key for Form Permissions
export const FORM_PERMISSION_KEY = Symbol('form-permission');

/**
 * A reactive permission checker.
 * Usage in Svelte 5 components: has('files.edit')
 */
export function has(requiredFlag: string) {
  const role = page.data?.user?.role || SETUP_ROLES.GUEST;
  const activeRoles = page.data?.activeRoles || {};

  return hasPermission(role, requiredFlag, activeRoles);
}