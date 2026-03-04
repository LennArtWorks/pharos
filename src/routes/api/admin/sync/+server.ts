import { json } from '@sveltejs/kit';
import { syncCloudIndex } from '$lib/server/cloud/sync';

export async function POST({ locals }) {
  // Debug: Check if locals are populated
  if (!locals.orgConfig) {
    console.error('SYNC ERROR: No organization config found in locals.');
    return json({ error: 'Unauthorized: No organization found for this subdomain' }, { status: 401 });
  }

  try {
    console.log(`Starting sync for: ${locals.orgConfig.organization_name}`);
    const updatedMeta = await syncCloudIndex(locals.orgConfig);
    return json({ success: true, count: Object.keys(updatedMeta.nodes).length });
  } catch (e: any) {
    console.error('SYNC ROUTE ERROR:', e.message);
    return json({ error: e.message }, { status: 500 });
  }
}