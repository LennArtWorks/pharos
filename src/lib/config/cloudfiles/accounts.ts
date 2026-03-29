// src/lib/config/cloudfiles/accounts.ts
import { SETUP_ROLES } from './roles';

/**
 * BLUEPRINT: accounts.fsrsecure
 * Defines the Master Auth Registry structure.
 */
export function generateDefaultAccountsRegistry() {
  return {
    _meta: { schemaVersion: "1.0", lastUpdated: Date.now() },
    identities: {} as Record<string, {
      accountId: string;
      authType: 'email' | 'email_totp';
      mfaSecret: string | null;
      isActive: boolean;
      email: string;
      displayName: string;
      access: {
        roles: string[];
        teams: string[];
        workspaces: string[];
        overrides: string[];
      }
    }>
  };
}