import Database from 'better-sqlite3';
import { fail, redirect } from '@sveltejs/kit';
import { allComponents, foundations } from '../../data'; // Clean import

export const load = async ({ params }) => {
  const db = new Database('aidev.db');

  const currentTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(params.id) as any;
  if (!currentTopic) throw redirect(303, '/files/dev/aidev');

  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];

  // Global Topics
  const globalCategories = categories.filter(c => c.is_global === 1).map(c => c.id);
  let globalPrompts = '';
  if (globalCategories.length > 0) {
    const placeholders = globalCategories.map(() => '?').join(',');
    const globals = db.prepare(`SELECT prompt_text FROM topics WHERE category_id IN (${placeholders})`).all(...globalCategories) as any[];
    globalPrompts = globals.map(g => g.prompt_text).filter(Boolean).join('\n\n');
  }

  // Recursive Parent Fetching
  let combinedPrompt = currentTopic.prompt_text || '';
  let combinedFiles = currentTopic.files_list || '';
  let combinedComponents = currentTopic.components_list || '';
  let combinedTokens = currentTopic.design_tokens || '';

  let parentId = currentTopic.parent_id;
  let parentChain: { id: string, title: string }[] = [];

  while (parentId) {
    const parent = db.prepare('SELECT * FROM topics WHERE id = ?').get(parentId) as any;
    if (parent) {
      parentChain.unshift({ id: parent.id, title: parent.title });
      if (parent.prompt_text) combinedPrompt = `${parent.prompt_text}\n\n---\n\n${combinedPrompt}`;
      if (parent.files_list) combinedFiles = `${parent.files_list}\n${combinedFiles}`;
      if (parent.components_list) combinedComponents = `${parent.components_list},${combinedComponents}`;
      if (parent.design_tokens) combinedTokens = `${parent.design_tokens},${combinedTokens}`;
      parentId = parent.parent_id;
    } else {
      break;
    }
  }

  const uniqueFiles = [...new Set(combinedFiles.split('\n').map((f: string) => f.trim()).filter(Boolean))].join('\n');
  const uniqueComponents = [...new Set(combinedComponents.split(',').map((c: string) => c.trim()).filter(Boolean))];
  const uniqueTokens = [...new Set(combinedTokens.split(',').map((t: string) => t.trim()).filter(Boolean))];

  // Build the massive context string for the AI based on the components selected
  // Because allComponents is strongly typed, we no longer need the `{ name: unknown }` hack
  let componentInstructions = uniqueComponents.map(name => {
    const compData = allComponents.find(c => c.name === name);
    return compData ? compData.context : '';
  }).filter(Boolean).join('\n\n');

  // Build token instructions
  let tokenInstructions = '';
  if (uniqueTokens.includes('colors')) {
    const colorData = foundations.find(f => f.name === 'Colors');
    if (colorData) tokenInstructions += `${colorData.context}\n\n`;
  }
  if (uniqueTokens.includes('icons')) {
    const iconData = foundations.find(f => f.name === 'Icons');
    if (iconData) tokenInstructions += `${iconData.context}\n\n`;
  }

  // Final Assembly
  if (globalPrompts) combinedPrompt = `[GLOBAL PROJECT CONTEXT]\n${globalPrompts}\n\n[SPECIFIC TASK CONTEXT]\n${combinedPrompt}`;

  if (tokenInstructions) combinedPrompt += `\n\n[DESIGN SYSTEM TOKENS]\n${tokenInstructions.trim()}`;
  if (componentInstructions) combinedPrompt += `\n\n[REQUIRED COMPONENTS API]\n${componentInstructions.trim()}`;

  return {
    topic: currentTopic,
    categories,
    parentChain,
    deepContext: {
      prompt: combinedPrompt,
      files: uniqueFiles,
      components: uniqueComponents,
      tokens: uniqueTokens
    }
  };
};

export const actions = {
  update: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const category_id = data.get('category_id')?.toString();
    const prompt_text = data.get('prompt_text')?.toString() || '';
    const files_list = data.get('files_list')?.toString() || '';

    const components_list = data.getAll('components').join(',');
    const design_tokens = data.getAll('tokens').join(',');

    if (!title || !category_id) return fail(400, { error: 'Title and Category are required.' });

    try {
      const db = new Database('aidev.db');
      db.prepare(`UPDATE topics SET title = ?, category_id = ?, prompt_text = ?, files_list = ?, components_list = ?, design_tokens = ? WHERE id = ?`)
        .run(title, category_id, prompt_text, files_list, components_list, design_tokens, params.id);
      return { success: true };
    } catch (err) {
      return fail(500, { error: 'Database error' });
    }
  },

  delete: async ({ params }) => {
    try {
      const db = new Database('aidev.db');
      db.prepare('DELETE FROM topics WHERE id = ?').run(params.id);
    } catch (err) {
      return fail(500, { error: 'Failed to delete' });
    }
    throw redirect(303, '/files/dev/aidev');
  }
};