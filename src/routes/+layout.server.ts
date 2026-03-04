
/* ---------------------------------------------------------------- *
 *  check for user role
 * ---------------------------------------------------------------- */

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    userRole: locals.user?.role || 'Anonymous',
    activeRoles: locals.orgConfig?.roles || {}
  };
};