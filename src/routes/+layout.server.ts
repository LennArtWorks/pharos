
/* ---------------------------------------------------------------- *
 *  check for user role
 * ---------------------------------------------------------------- */

import type { LayoutServerLoad } from './$types';
import { DEFAULT_ROLES } from '$lib/config/permissions';
import { generateAnonymousUser, generateRandomColor, generateRandomName } from '$lib/utils/user';


export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user ? {
    id: locals.user.id,
    name: locals.user.name || generateRandomName(),
    color: generateRandomColor(),
    role: locals.user.role
  } : generateAnonymousUser();

  return {
    user,
    activeRoles: locals.orgConfig?.roles || DEFAULT_ROLES
  };
};