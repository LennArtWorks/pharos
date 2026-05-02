// src/lib/utils/config/cloudfiles/user.ts

import { SETUP_ROLES } from '$lib/config/cloudfiles/roles';
import { USER_CONFIG, RANDOM_NAME_PARTS, generateUserIdentity, generateDefaultUserProfile } from '$lib/config/cloudfiles/user';

export function generateRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

export function generateRandomName() {
  const adj = RANDOM_NAME_PARTS.ADJECTIVES[Math.floor(Math.random() * RANDOM_NAME_PARTS.ADJECTIVES.length)];
  const animal = RANDOM_NAME_PARTS.ANIMALS[Math.floor(Math.random() * RANDOM_NAME_PARTS.ANIMALS.length)];
  return `${adj} ${animal}`;
}

export function generateAccountId() {
  // Uses the config prefix + timestamp for a unique, sortable ID
  return `${USER_CONFIG.ID_PREFIX}_${Date.now()}`;
}

export function generateDisplayName(email: string) {
  // Converts "john.doe@email.com" into "John Doe"
  const prefix = email.split('@')[0];
  return prefix
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function createNewUser(email: string, mfaSecret: string | null = null, providedName?: string, role: string = SETUP_ROLES.NEW_USER) {
  const accountId = generateAccountId();
  const finalName = providedName || generateDisplayName(email);

  return {
    accountId,
    // The object that gets injected into accounts.appsys -> identities[email]
    identityEntry: generateUserIdentity(accountId, email, finalName, role, mfaSecret),
    // The object that gets written to usr_XXXX.appsys.appsecure
    profileEntry: generateDefaultUserProfile(accountId)
  };
}