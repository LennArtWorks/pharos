import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';

export const POST = async ({ cookies }) => {
  const sessionId = cookies.get('fsr_session');

  if (sessionId) {
    // 1. Delete session from SQLite database
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    // 2. Clear the secure cookie
    cookies.delete('fsr_session', { path: '/' });
  }

  // 3. Redirect to login
  throw redirect(303, '/login');
};