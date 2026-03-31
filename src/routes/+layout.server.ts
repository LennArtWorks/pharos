import type { LayoutServerLoad } from './$types';
import { DEFAULT_ROLES, SETUP_ROLES } from '$lib/config/cloudfiles/roles';
import { generateAnonymousSessionUser } from '$lib/config/cloudfiles/user';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Fallback to our config's guest role if orgConfig isn't loaded yet
  const guestRole = locals.orgConfig?.guestRole || SETUP_ROLES.GUEST;

  // Since hooks.server.ts already generates an anonymous user for guests, 
  // locals.user should always exist. The fallback here is just for type safety.
  const user = locals.user ? {
    id: locals.user.id,
    name: locals.user.name,
    color: locals.user.color,
    role: locals.user.role,
    overrides: locals.user.overrides || []
  } : generateAnonymousSessionUser(guestRole);

  return {
    user,
    operator: locals.operator || null,
    activeRoles: locals.orgConfig?.roles || DEFAULT_ROLES
  };
};