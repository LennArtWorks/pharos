import { json } from '@sveltejs/kit';
import { getFileSystemMeta, transformNodesToTree } from '$lib/server/cloud/service';

export async function GET({ locals }) {
  if (!locals.orgConfig) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    const tree = transformNodesToTree(meta.nodes);
    return json(tree);
  } catch (e) {
    return json({ error: 'Failed to load file system' }, { status: 500 });
  }
}