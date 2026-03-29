rename to +layout.server.ts to prevent normal users that arent Admin from entering
needs to be changes to permission based not role based check

import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  // If no user, or user is not Admin, kick them out
  // (Adjust 'Admin' if your top role is named differently)
  if (!locals.user || locals.user.role !== 'Admin') {
    throw redirect(303, '/files'); // Send them back to the safe zone
  }
  return {};
};

