import { page } from '$app/state';
import { SETUP_ROLES } from '$lib/config/cloudfiles/roles';

export const FORM_PERMISSION_KEY = Symbol('form-permission');

/**
 * Smart hierarchical permission checker.
 * used in backend
 */
export function hasPermission(
  userRole: string,
  requiredFlag: string,
  activeRoles: Record<string, string[]>,
  userOverrides: string[] = [] // Checks direct overrides first
): boolean {
  // 1. Check Direct Overrides
  if (userOverrides.includes('*')) return true;
  if (userOverrides.includes(requiredFlag)) return true;

  const parts = requiredFlag.split('.');
  let currentPath = '';
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += i === 0 ? parts[i] : '.' + parts[i];
    if (userOverrides.includes(`${currentPath}.*`)) return true;
  }
  if (parts.length === 3 && userOverrides.includes(`${parts[0]}.${parts[2]}`)) return true;

  // 2. Check Role Permissions
  const rolePermissions = activeRoles[userRole] || ([] as string[]);

  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(requiredFlag)) return true;

  currentPath = '';
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += i === 0 ? parts[i] : '.' + parts[i];
    if (rolePermissions.includes(`${currentPath}.*`)) return true;
  }

  if (parts.length === 3 && rolePermissions.includes(`${parts[0]}.${parts[2]}`)) return true;

  return false;
}

/**
 * A reactive permission checker.
 * Usage in Svelte 5 components: has('files.edit')
 * for frontend checks
 */
export function has(requiredFlag: string) {
  // Gracefully fallback if page.data isn't loaded yet
  if (!page.data) return false;

  const role = page.data.user?.role || SETUP_ROLES.GUEST;

  // FIX: Access activeRoles directly from page.data!
  const activeRoles = page.data.activeRoles || {};
  const overrides = page.data.user?.overrides || [];

  return hasPermission(role, requiredFlag, activeRoles, overrides);
}