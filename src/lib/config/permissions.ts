/**
 * Check for permissions:
 * <script>
 *   import { can } from '$lib/utils/permissions';
 *  import { PERMISSIONS } from '$lib/config/permissions';
 * </script>
 *
 * {#if $can(PERMISSIONS.FILES.EDIT)}
 *  <button>Edit</button>
 * {/if} 
 *  */

export const PERMISSIONS = {
  GLOBAL_ADMIN: '*',
  SYSTEM: {
    ALL: 'system.*',
    MANAGE_USERS: 'system.manage_users',
    MANAGE_ROLES: 'system.manage_roles',
    VIEW_SYSFOLDERS: 'system.view_sysfolders',
    SETTINGS_WRITE: 'system.settings_write',
  },
  WORKSPACE: {
    ALL: 'workspace.*',
    CREATE: 'workspace.create',
    EDIT: 'workspace.edit',
    DELETE: 'workspace.delete',
    MOVE: 'workspace.move',
    MANAGE_PERMISSION: 'workspace.manage_permission',
  },
  FILES: {
    ALL: 'files.*',
    READ: 'files.read',
    CREATE: 'files.create',
    EDIT: 'files.edit',
    DELETE: 'files.delete',
    MOVE: 'files.move',
    PUBLISH: 'files.publish',
    MANAGE_PERMISSION: 'files.manage_permission',
  },
  INTERACTION: {
    ALL: 'interaction.*',
    SUBMIT_FORMS: 'interaction.submit_forms',
    BOOK_SHIFTS: 'interaction.book_shifts',
    CHECKOUT: 'interaction.checkout',
  }
} as const;

export type PermissionFlag = string;

// The Blueprint: Used when creating the roles file for the first time
export const DEFAULT_ROLES: Record<string, string[]> = {
  Admin: [PERMISSIONS.GLOBAL_ADMIN],
  Member: [
    PERMISSIONS.WORKSPACE.CREATE,
    PERMISSIONS.FILES.ALL,
    PERMISSIONS.INTERACTION.ALL
  ],
  Guest: [
    PERMISSIONS.FILES.READ,
    PERMISSIONS.INTERACTION.BOOK_SHIFTS,
    PERMISSIONS.INTERACTION.SUBMIT_FORMS
  ],
  // The baseline for non-logged-in users
  Anonymous: [
    PERMISSIONS.FILES.READ,
    PERMISSIONS.INTERACTION.SUBMIT_FORMS
  ]
};

/**
 * Checks if a user has a specific permission based on the active cloud roles.
 */
export function hasPermission(
  userRole: string,
  requiredFlag: string,
  activeRoles: Record<string, string[]> // <--- We now pass the roles dynamically
): boolean {
  // Fixes the "never" error by explicitly telling TypeScript it's an array of strings
  const rolePermissions = activeRoles[userRole] || ([] as string[]);

  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(requiredFlag)) return true;

  const [category] = requiredFlag.split('.');
  if (rolePermissions.includes(`${category}.*`)) return true;

  return false;
}