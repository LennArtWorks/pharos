
/* ---------------------------------------------------------------- *
 *  check for user role
 * ---------------------------------------------------------------- */

import type { LayoutServerLoad } from './$types';
import { DEFAULT_ROLES, NOTLOGGEDIN_ROLE } from '$lib/config/permissions';

const ADJECTIVES = ['Anonymous', 'Mysterious', 'Clever', 'Sleepy', 'Brave', 'Curious', 'Swift'];
const ANIMALS = ['Axolotl', 'Capybara', 'Pangolin', 'Quokka', 'Wombat', 'Lemur', 'Red Panda'];

// Extracted color generator
function generateRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  return `${adj} ${animal}`
}


function generateAnonymousUser() {
  return {
    id: crypto.randomUUID(),
    name: generateRandomName(),
    color: generateRandomColor(),
    role: NOTLOGGEDIN_ROLE
  };
}

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