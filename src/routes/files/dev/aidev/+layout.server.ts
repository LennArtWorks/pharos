import Database from 'better-sqlite3';

export const load = async () => {
  const db = new Database('aidev.db');

  // AUTO-CLEANUP: Delete standard categories that have zero topics.
  db.prepare('DELETE FROM categories WHERE is_global = 0 AND id NOT IN (SELECT category_id FROM topics)').run();

  // Ensure the Global Category always exists
  const globalCheck = db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_global = 1').get() as { count: number };
  if (globalCheck.count === 0) {
    db.prepare('INSERT INTO categories (id, name, sort_order, is_global) VALUES (?, ?, ?, ?)').run('cat_global', 'Global Project Context', 0, 1);
  }

  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];
  const topics = db.prepare('SELECT id, category_id, parent_id, title, sort_order FROM topics ORDER BY sort_order ASC').all() as any[];

  const globalCategories = categories.filter(c => c.is_global === 1);
  const standardCategories = categories.filter(c => c.is_global === 0);

  const buildTopicTree = (categoryId: string, parentId: string | null = null): any[] => {
    return topics
      .filter(t => t.category_id === categoryId && t.parent_id === parentId)
      .map(t => ({
        ...t,
        children: buildTopicTree(categoryId, t.id)
      }));
  };

  const tree = standardCategories.map(cat => ({
    ...cat,
    topics: buildTopicTree(cat.id, null)
  }));

  const globals = globalCategories.map(cat => ({
    ...cat,
    topics: buildTopicTree(cat.id, null)
  }));

  return { tree, globals };
};