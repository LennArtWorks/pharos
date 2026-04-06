import { json } from '@sveltejs/kit';
import { logOperatorAction } from '$lib/server/audit';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';

export async function POST({ request, cookies, locals }) {
  const operator = locals.operator;
  if (!operator) return json({ error: 'Unauthorized' }, { status: 403 });

  const { action, role, persistent, devMode } = await request.json();
  const orgConfig = locals.orgConfig;
  const orgId = locals.orgConfig?.organisation_id || null;

  // Extremely safe defaults
  const cookieOptions: any = { path: '/', httpOnly: true, sameSite: 'lax' };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // 1. Handle DevMode (NO MORE DELETE! We overwrite with string 'true' or 'false')
  if (devMode !== undefined) {
    console.log(`[DEV API] Setting DevMode to: ${devMode}`);
    cookies.set('fsr_devmode', devMode ? 'true' : 'false', { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
    return json({ success: true });
  }

  // 2. Handle Role Simulation
  if (operator.tier !== 'support' && operator.tier !== 'owner') return json({ error: 'Unauthorized Tier' }, { status: 403 });

  if (action === 'start' && role) {
    if (persistent) cookieOptions.maxAge = 30 * 24 * 60 * 60;
    cookies.set('fsr_simulation', role, cookieOptions);

    if (orgId && orgConfig) {
      logOperatorAction(operator.email, 'START_SIMULATION', orgId, { role, persistent });
      queueCloudSync(orgConfig); // <-- This triggers the WebDAV flush!
    }

    return json({ success: true });
  }

  if (action === 'stop') {
    cookies.set('fsr_simulation', '', { ...cookieOptions, maxAge: 0 });

    if (orgId && orgConfig) {
      logOperatorAction(operator.email, 'STOP_SIMULATION', orgId, {});
      queueCloudSync(orgConfig); // <-- This triggers the WebDAV flush!
    }

    return json({ success: true });
  }

  return json({ error: 'Invalid payload' }, { status: 400 });
}