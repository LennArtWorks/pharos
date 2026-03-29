// src/lib/config/cloudfiles/user.ts

import { generateRandomColor, generateRandomName, generateAccountId, generateDisplayName } from '$lib/utils/config/cloudfiles/user';
import { SETUP_ROLES } from './roles';

export const USER_CONFIG = {
  ID_PREFIX: 'usr'
} as const;

export const RANDOM_NAME_PARTS = {
  ADJECTIVES: ['Anonymous', 'Mysterious', 'Clever', 'Sleepy', 'Brave', 'Curious', 'Swift'],
  ANIMALS: ['Axolotl', 'Capybara', 'Pangolin', 'Quokka', 'Wombat', 'Lemur', 'Red Panda']
} as const;

// 1. Generates the runtime anonymous session user (for hooks.server.ts)
export function generateAnonymousSessionUser(role: string) {
  return {
    id: crypto.randomUUID(),
    name: generateRandomName(),
    role: role,
    color: generateRandomColor(),
    overrides: []
  };
}

// 2. Initiated user entry for the Master Auth Registry (accounts.fsrsys)
export function generateUserIdentity(accountId: string, email: string, name: string, role: string, mfaSecret: string | null = null) {
  return {
    accountId,
    authType: mfaSecret ? 'email_totp' : 'email',
    mfaSecret: mfaSecret,
    isActive: true,
    email: email,
    displayName: name,
    access: {
      roles: [role],
      teams: [],
      workspaces: [],
      overrides: []
    }
  };
}

// 3. Builds the individual user preferences profile (usr_XXX.fsrsys.fsrsecure)
export function generateDefaultUserProfile(accountId: string) {
  return {
    _meta: { schemaVersion: "1.0", accountId },
    profile: {
      firstName: "",
      lastName: "",
      avatarUrl: "",
      color: generateRandomColor(),
      statusMessage: ""
    },
    preferences: {
      language: "en-US",
      notifications: { emailMentions: true },
      ui: { pinnedWorkspaces: [], defaultStartupView: "dashboard" }
    }
  };
}

