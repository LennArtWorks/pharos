import { SETUP_ROLES } from '$lib/config/permissions';
import { USER_CONFIG, RANDOM_NAME_PARTS } from '$lib/config/user';

export function generateRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

export function generateRandomName() {
  const adj = RANDOM_NAME_PARTS.ADJECTIVES[Math.floor(Math.random() * RANDOM_NAME_PARTS.ADJECTIVES.length)];
  const animal = RANDOM_NAME_PARTS.ANIMALS[Math.floor(Math.random() * RANDOM_NAME_PARTS.ANIMALS.length)];
  return `${adj} ${animal}`;
}

export function generateAnonymousUser() {
  return {
    id: crypto.randomUUID(), // Or generate with USER_CONFIG.ID_PREFIX if preferred
    name: generateRandomName(),
    color: generateRandomColor(),
    role: SETUP_ROLES.GUEST
  };
}

export function getDefaultProfile(accountId: string, email: string) {
  return {
    _meta: {
      schemaVersion: "1.0",
      accountId: accountId
    },
    profile: {
      firstName: "",
      lastName: "",
      displayName: email.split('@')[0],
      avatarUrl: "",
      color: generateRandomColor(),
      statusMessage: ""
    },
    access: {
      roles: [SETUP_ROLES.NEW_USER],
      teams: [],
      workspaces: {}
    },
    preferences: {
      language: "en-US",
      notifications: { emailMentions: true },
      ui: { pinnedWorkspaces: [], defaultStartupView: "dashboard" }
    }
  };
}