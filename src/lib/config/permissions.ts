/**
 * Check for permissions:
 * <script>
 *   import { has } from '$lib/utils/permissions';
 *  import { PERMISSIONS } from '$lib/config/permissions';
 * </script>
 *
 * {#if $has(PERMISSIONS.FILES.EDIT)}
 *  <button>Edit</button>
 * {/if} 
 *  */

// src/lib/config/permissions.ts

// Helper to dynamically build file permissions for any prefix (e.g., 'files' or 'system.files')
const buildFilePermissions = <T extends string>(prefix: T) => ({
  ALL: `${prefix}.*` as const,               // Full access to all file operations in this scope
  VIEW: `${prefix}.view` as const,             // Can see the file exists in lists/trees
  READ: `${prefix}.read` as const,             // Can open and read the file content
  CREATE: `${prefix}.create` as const,         // Can create new files of this type
  EDIT: `${prefix}.edit` as const,             // Can modify file content
  DELETE: `${prefix}.delete` as const,         // Can delete the file
  MOVE: `${prefix}.move` as const,             // Can move the file to another folder
  PUBLISH: `${prefix}.publish` as const,       // Can make the file public / create share links
  MANAGE_PERMISSION: `${prefix}.manage_permission` as const, // Can change who has access to this specific file
  DOWNLOAD: `${prefix}.download` as const      // Can download the raw physical file
});

export const PERMISSIONS = {
  GLOBAL_ADMIN: '*', // Bypass all permission checks, full system access

  SYSTEM: {
    ALL: 'system.*', // Full access to all system-level settings and sysfiles
    MANAGE_USERS: 'system.manage_users', // Can create/delete users and view accounts
    MANAGE_ROLES: 'system.manage_roles', // Can edit the roles.appsys file
    SETTINGS: {
      WRITE: 'system.settings_write', // Can edit organisation settings
      VIEW: 'system.settings_view' // Can see organisation settings
    },
    // Dynamically generates: system.files.*, system.files.read, etc.
    FILES: buildFilePermissions('system.files')
  },

  WORKSPACE: {
    ALL: 'workspace.*', // Full access to workspace management
    CREATE: 'workspace.create', // Can create a new root workspace
    EDIT: 'workspace.edit', // Can rename or change workspace settings
    DELETE: 'workspace.delete', // Can delete an entire workspace
    MOVE: 'workspace.move', // Can reorder workspaces
    MANAGE_PERMISSION: 'workspace.manage_permission', // Can assign users/teams to a workspace
  },

  // Dynamically generates: files.*, files.read, etc.
  FILES: buildFilePermissions('files'),

  INTERACTION: {
    ALL: 'interaction.*', // Full access to all interactive modules
    SUBMIT_FORMS: 'interaction.submit_forms', // Can submit public/internal forms
    BOOK_SHIFTS: 'interaction.book_shifts', // Can book timeslots in the calendar
    CHECKOUT: 'interaction.checkout', // Can check out inventory items
  }
} as const;

export type PermissionFlag = string;

