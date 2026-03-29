/**
 * @route POST /logout
 * Destroys the active session in SQLite and clears the secure browser cookie.
 */
import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { SESSION_COOKIE } from '$lib/config/cookies/session';

export const POST = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE.NAME);

  if (sessionId) {
    // 1. Delete session from SQLite database
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    // 2. Clear the secure cookie using our unified config
    cookies.delete(SESSION_COOKIE.NAME, { path: SESSION_COOKIE.OPTIONS.path });
  }

  // 3. Redirect to login
  throw redirect(303, '/login');
};