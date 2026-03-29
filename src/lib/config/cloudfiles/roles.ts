// The Blueprint: Used when creating the roles file for the first time

import { PERMISSIONS } from "../permissions";

export const SETUP_ROLES = {
  GUEST: 'Guest', // the role not logged in users get
  NEW_USER: 'Member'
} as const;

export const DEFAULT_ROLES: Record<string, string[]> = {
  Admin: [PERMISSIONS.GLOBAL_ADMIN],
  Member: [
    PERMISSIONS.WORKSPACE.CREATE,
    PERMISSIONS.FILES.ALL,
    PERMISSIONS.INTERACTION.ALL
  ],
  NewUser: [
    PERMISSIONS.FILES.READ,
    PERMISSIONS.INTERACTION.BOOK_SHIFTS,
    PERMISSIONS.INTERACTION.SUBMIT_FORMS
  ],
  [SETUP_ROLES.GUEST]: [
    PERMISSIONS.GLOBAL_ADMIN,
    PERMISSIONS.FILES.READ,
    PERMISSIONS.INTERACTION.SUBMIT_FORMS
  ]
};

/**
 * BLUEPRINT: roles.fsrsys
 * Defines the initial Role-Based Access Control structure for new tenants.
 */
export function generateDefaultRolesIndex() {
  return {
    guestRole: SETUP_ROLES.GUEST,
    newUserRole: SETUP_ROLES.NEW_USER,
    roles: DEFAULT_ROLES
  };
}