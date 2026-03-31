import Database from 'better-sqlite3';
import { json } from '@sveltejs/kit';

// Helper to recursively update category_id for a topic's entire tree
function updateCategoryRecursive(db: Database.Database, topicId: string, newCategoryId: string) {
  db.prepare('UPDATE topics SET category_id = ? WHERE id = ?').run(newCategoryId, topicId);
  const children = db.prepare('SELECT id FROM topics WHERE parent_id = ?').all(topicId) as { id: string }[];
  for (const child of children) {
    updateCategoryRecursive(db, child.id, newCategoryId);
  }
}

export const POST = async ({ request }) => {
  const { draggedId, targetId, action, categoryId, parentId } = await request.json();
  const db = new Database('databases/dev.db');

  let newParentId = null;
  let siblings = [];

  const getSiblings = (pId: string | null, catId: string) => {
    if (pId === null) {
      return db.prepare(`SELECT id FROM topics WHERE parent_id IS NULL AND category_id = ? ORDER BY sort_order ASC`).all(catId) as any[];
    } else {
      return db.prepare(`SELECT id FROM topics WHERE parent_id = ? AND category_id = ? ORDER BY sort_order ASC`).all(pId, catId) as any[];
    }
  };

  // --- Handle dragging into a completely empty category/folder ---
  if (action === 'empty_insert') {
    newParentId = parentId; // Will be null if it's an empty root category, or the folder ID if it's an empty sub-folder

    // Get all items in the new destination (should just be the item itself after we move it)
    siblings = getSiblings(newParentId, categoryId);
    const filtered = siblings.filter((s: any) => s.id !== draggedId);
    filtered.push({ id: draggedId });
    siblings = filtered;

  } else {
    // --- Standard drag-and-drop relative to an existing target ---
    const target = db.prepare('SELECT parent_id, sort_order FROM topics WHERE id = ?').get(targetId) as any;
    if (!target) return json({ error: 'Target not found' }, { status: 404 });

    newParentId = target.parent_id;

    if (action === 'inside') {
      newParentId = targetId;
      siblings = getSiblings(targetId, categoryId);

      const filtered = siblings.filter((s: any) => s.id !== draggedId);
      filtered.push({ id: draggedId });
      siblings = filtered;

    } else {
      siblings = getSiblings(newParentId, categoryId);

      let filtered = siblings.filter((s: any) => s.id !== draggedId);
      const targetIndex = filtered.findIndex((s: any) => s.id === targetId);

      if (action === 'before') {
        filtered.splice(targetIndex, 0, { id: draggedId });
      } else {
        filtered.splice(targetIndex + 1, 0, { id: draggedId });
      }
      siblings = filtered;
    }
  }

  const updateStmt = db.prepare('UPDATE topics SET sort_order = ?, parent_id = ?, category_id = ? WHERE id = ?');

  const transaction = db.transaction((items) => {
    // 1. Force the dragged item and ALL of its nested children to inherit the new category
    updateCategoryRecursive(db, draggedId, categoryId);

    // 2. Process the sorting and standard parent reassignment for the top-level items in this level
    items.forEach((item: { id: string }, index: number) => {
      updateStmt.run(index, newParentId, categoryId, item.id);
    });
  });

  try {
    transaction(siblings);
    return json({ success: true });
  } catch (error) {
    console.error('Sort Error:', error);
    return json({ success: false, error: 'Database transaction failed' }, { status: 500 });
  }
};