import Database from 'better-sqlite3';
import { fail, redirect } from '@sveltejs/kit';

export const load = async () => {
  const db = new Database('aidev.db');
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];
  const topics = db.prepare('SELECT id, title, category_id FROM topics ORDER BY title ASC').all() as any[];

  return { categories, topics };
};

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    let category_id = data.get('category_id')?.toString();
    const new_category_name = data.get('new_category_name')?.toString().trim();
    const parent_id = data.get('parent_id')?.toString() || null;
    const prompt_text = data.get('prompt_text')?.toString() || '';
    const files_list = data.get('files_list')?.toString() || '';

    // NEW: Fetch selected checkboxes for tokens & components
    const components_list = data.getAll('components').join(',');
    const design_tokens = data.getAll('tokens').join(',');

    if (!title) return fail(400, { error: 'Title is required.' });

    const db = new Database('aidev.db');

    if (parent_id && parent_id !== 'none') {
      const parentTopic = db.prepare('SELECT category_id FROM topics WHERE id = ?').get(parent_id) as any;
      if (parentTopic) {
        category_id = parentTopic.category_id;
      }
    } else {
      if (category_id === 'new_cat' && new_category_name) {
        category_id = `cat_${Date.now()}`;
        try {
          db.prepare('INSERT INTO categories (id, name, sort_order) VALUES (?, ?, 99)').run(category_id, new_category_name);
        } catch (err) {
          return fail(500, { error: 'Failed to create new category' });
        }
      } else if (!category_id || category_id === 'new_cat') {
        return fail(400, { error: 'Category is required.' });
      }
    }

    const id = `top_${Date.now()}`;
    try {
      db.prepare(`
        INSERT INTO topics (id, category_id, parent_id, title, prompt_text, files_list, components_list, design_tokens) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, category_id, parent_id === 'none' ? null : parent_id, title, prompt_text, files_list, components_list, design_tokens);
    } catch (err) {
      console.error(err);
      return fail(500, { error: 'Database error creating topic' });
    }

    throw redirect(303, `/files/dev/aidev/${id}`);
  }
};