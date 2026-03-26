import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

export const POST = async ({ request }) => {
  const { action, id, name, targetId, dragAction } = await request.json();
  const db = new Database('aidev.db');

  try {
    if (action === 'rename' && id && name) {
      db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
      return json({ success: true });
    }

    if (action === 'sort' && id && targetId && dragAction) {
      // Force string types to prevent indexOf() failing on int vs string comparisons
      const strId = id.toString();
      const strTargetId = targetId.toString();

      const categories = db.prepare('SELECT id FROM categories WHERE is_global = 0 ORDER BY sort_order ASC').all() as { id: any }[];

      // Map database IDs to strings before filtering/indexing
      let orderedIds = categories.map(c => c.id.toString()).filter(cid => cid !== strId);
      const targetIndex = orderedIds.indexOf(strTargetId);

      if (targetIndex !== -1) {
        if (dragAction === 'before') {
          orderedIds.splice(targetIndex, 0, strId);
        } else {
          orderedIds.splice(targetIndex + 1, 0, strId);
        }
      } else {
        orderedIds.push(strId);
      }

      const stmt = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
      const transaction = db.transaction((ids: string[]) => {
        ids.forEach((catId, index) => stmt.run(index, catId));
      });

      transaction(orderedIds);
      return json({ success: true });
    }

    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Category API Error:', err);
    return json({ success: false, error: 'Database error' }, { status: 500 });
  }
};