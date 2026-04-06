import { error } from '@sveltejs/kit';

// Align exactly with the TypeScript definitions parsed from your .env
const OP_TIERS = {
  DESIGNER: 'designer',   // Tier 1
  DEVELOPER: 'developer', // Tier 2
  SUPPORT: 'support',     // Tier 3
  OWNER: 'owner'          // Tier 4
} as const;

// Map tiers to numeric values for easy "minimum clearance" checks
const TIER_LEVEL = {
  [OP_TIERS.DESIGNER]: 1,
  [OP_TIERS.DEVELOPER]: 2,
  [OP_TIERS.SUPPORT]: 3,
  [OP_TIERS.OWNER]: 4
} as const;

export const load = async ({ locals, url }) => {
  const operator = locals.operator;

  // 1. Absolute Block: Kick out anyone who isn't a logged-in Operator.
  if (!operator) {
    throw error(404, 'Not found');
  }

  const currentLevel = TIER_LEVEL[operator.tier];

  // 2. Sub-Route Tier Guards (Granular Control)

  // Block Backend, Telemetry, and Logs (Requires Tier 3: Support)
  if (url.pathname.startsWith('/dev/backend')) {
    if (currentLevel < TIER_LEVEL[OP_TIERS.SUPPORT]) {
      throw error(403, 'Insufficient clearance. Requires Support tier or higher.');
    }
  }

  // Block highly sensitive routes like global settings or DB deletion (Requires Tier 4: Owner)
  if (url.pathname.startsWith('/dev/settings') || url.pathname.startsWith('/dev/infrastructure')) {
    if (currentLevel < TIER_LEVEL[OP_TIERS.OWNER]) {
      throw error(403, 'Only owners can access global platform infrastructure.');
    }
  }

  // Tier 1 (Designers) and Tier 2 (Developers) will naturally fall through 
  // and be allowed to access the base /dev route and design system pages (e.g., /dev/icons).

  return {
    operator
  };
};