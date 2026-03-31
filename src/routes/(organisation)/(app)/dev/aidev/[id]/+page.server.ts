import Database from 'better-sqlite3';
import { fail, redirect } from '@sveltejs/kit';
import { allComponents, foundations } from '../../data';

export const load = async ({ params }) => {
  const db = new Database('databases/dev.db');

  const currentTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(params.id) as any;
  if (!currentTopic) throw redirect(303, '/dev/aidev');

  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];

  // 1. Fetch Global Topics
  const allGlobalTopics = db.prepare(`
    SELECT id, parent_id, title, prompt_text, files_list, components_list, design_tokens
    FROM topics 
    WHERE category_id IN (SELECT id FROM categories WHERE is_global = 1)
  `).all() as any[];

  // 2. Filter Active Globals
  const glMode = currentTopic.global_topics_list || 'ALL';
  let activeGlobalTopics = [];
  if (glMode === 'ALL') {
    activeGlobalTopics = allGlobalTopics;
  } else if (glMode !== 'NONE') {
    const selectedIds = glMode.split(',');
    activeGlobalTopics = allGlobalTopics.filter(gt => selectedIds.includes(gt.id));
  }

  const descendantIds = new Set<string>();
  const getDescendants = (parentId: string) => {
    // Querying the entire topics table to catch all children, global or not
    const children = db.prepare('SELECT id FROM topics WHERE parent_id = ?').all(parentId) as any[];
    for (const child of children) {
      descendantIds.add(child.id.toString());
      getDescendants(child.id);
    }
  };

  if (currentTopic.id) {
    getDescendants(currentTopic.id);
  }

  // Filter out the current topic AND its descendants
  activeGlobalTopics = activeGlobalTopics.filter(gt =>
    gt.id.toString() !== currentTopic.id.toString() && !descendantIds.has(gt.id.toString())
  );

  const globalTopicIds = activeGlobalTopics.map(gt => gt.id);

  // 3. Accumulate data (Files, Comps, Tokens, Prompts)
  let combinedFiles: string[] = currentTopic.files_list ? currentTopic.files_list.split('\n') : [];
  let combinedComponents: string[] = currentTopic.components_list ? currentTopic.components_list.split(',') : [];
  let combinedTokens: string[] = currentTopic.design_tokens ? currentTopic.design_tokens.split(',') : [];

  const ignoredParents = currentTopic.ignored_parents ? currentTopic.ignored_parents.split(',') : [];
  let parentChain: { id: string, title: string, ignored: boolean }[] = [];
  let parentPrompts: string[] = [];

  // Traverse Parents
  let parentId = currentTopic.parent_id;
  while (parentId) {
    const parent = db.prepare('SELECT * FROM topics WHERE id = ?').get(parentId) as any;
    if (parent) {
      const isIgnored = ignoredParents.includes(parent.id);
      parentChain.unshift({ id: parent.id, title: parent.title, ignored: isIgnored });

      if (!isIgnored) {
        // Neu: Nur hinzufügen, wenn es nicht bereits als globales Topic gerendert wird
        if (parent.prompt_text && !globalTopicIds.includes(parent.id)) {
          parentPrompts.unshift(`--- ${parent.title} ---\n${parent.prompt_text}`);
        }
        // Dateien und Komponenten können bleiben, da sie später durch [...new Set()] dedupliziert werden
        if (parent.files_list) combinedFiles.push(...parent.files_list.split('\n'));
        if (parent.components_list) combinedComponents.push(...parent.components_list.split(','));
        if (parent.design_tokens) combinedTokens.push(...parent.design_tokens.split(','));
      }
      parentId = parent.parent_id;
    } else {
      break;
    }
  }

  const parentIds = parentChain.map(p => p.id);

  // This array goes to the frontend to render the Global Topics sidebar/list.
  // It excludes any global topic that is already part of the breadcrumb.
  const uiVisibleGlobalTopics = activeGlobalTopics.filter(gt => !parentIds.includes(gt.id));

  // Inject active Global Topics into the merge pools
  activeGlobalTopics.forEach(gt => {
    if (gt.files_list) combinedFiles.push(...gt.files_list.split('\n'));
    if (gt.components_list) combinedComponents.push(...gt.components_list.split(','));
    if (gt.design_tokens) combinedTokens.push(...gt.design_tokens.split(','));
  });

  // Clean and deduplicate arrays
  const uniqueFiles = [...new Set(combinedFiles.map(f => f.trim()).filter(Boolean))];
  const uniqueComponents = [...new Set(combinedComponents.map(c => c.trim()).filter(Boolean))];
  const uniqueTokens = [...new Set(combinedTokens.map(t => t.trim()).filter(Boolean))];

  // Map Contexts
  const componentInstructions = uniqueComponents.map(name => {
    const compData = allComponents.find(c => c.name === name);
    return compData ? compData.context : '';
  }).filter(Boolean).join('\n\n');

  let tokenInstructions = '';
  if (uniqueTokens.includes('colors')) {
    const cData = foundations.find(f => f.name === 'Colors');
    if (cData) tokenInstructions += `${cData.context}\n\n`;
  }
  if (uniqueTokens.includes('icons')) {
    const iData = foundations.find(f => f.name === 'Icons');
    if (iData) tokenInstructions += `${iData.context}\n\n`;
  }

  const activeImportStrings = uniqueComponents
    .map(name => allComponents.find(c => c.name === name)?.importStr)
    .filter(Boolean);

  // --- 4. BUILD THE FINAL CLEAN STRING ---
  let finalOutputParts: string[] = [];

  if (activeGlobalTopics.length > 0) {
    finalOutputParts.push('[GLOBAL PROJECT CONTEXT]');
    activeGlobalTopics.forEach(gt => {
      if (gt.prompt_text) finalOutputParts.push(`--- ${gt.title} ---\n${gt.prompt_text}`);
    });
  }

  if (parentPrompts.length > 0) {
    finalOutputParts.push('[PARENT CONTEXT]');
    finalOutputParts.push(parentPrompts.join('\n\n'));
  }

  if (currentTopic.prompt_text) {
    finalOutputParts.push('[SPECIFIC TASK CONTEXT]');
    finalOutputParts.push(currentTopic.prompt_text);
  }

  if (tokenInstructions) {
    finalOutputParts.push('[DESIGN SYSTEM TOKENS]');
    finalOutputParts.push(tokenInstructions.trim());
  }

  if (componentInstructions) {
    finalOutputParts.push('[REQUIRED COMPONENTS API]');
    finalOutputParts.push(componentInstructions);
  }

  if (uniqueFiles.length > 0) {
    finalOutputParts.push('REQUIRED FILES:');
    finalOutputParts.push(uniqueFiles.join('\n'));
  }

  if (activeImportStrings.length > 0) {
    finalOutputParts.push('REQUIRED COMPONENTS:');
    finalOutputParts.push(activeImportStrings.join('\n'));
  }

  return {
    topic: currentTopic,
    categories,
    parentChain,
    allGlobalTopics,
    activeGlobalTopics,
    uiVisibleGlobalTopics,
    globalMode: glMode,
    rawOutputString: finalOutputParts.join('\n\n'), // The beautifully clean AI context string
    deepContext: {
      files: uniqueFiles,
      components: uniqueComponents,
      tokens: uniqueTokens,
      imports: activeImportStrings
    }
  };
};

export const actions = {
  update: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const category_id = data.get('category_id')?.toString();
    const human_description = data.get('human_description')?.toString() || '';
    const prompt_text = data.get('prompt_text')?.toString() || '';
    const files_list = data.get('files_list')?.toString() || '';
    const ignored_parents = data.get('ignored_parents')?.toString() || '';

    const components_list = data.getAll('components').join(',');
    const design_tokens = data.getAll('tokens').join(',');

    const global_mode = data.get('global_mode')?.toString() || 'ALL';
    let global_topics_list = 'ALL';
    if (global_mode === 'NONE') global_topics_list = 'NONE';
    if (global_mode === 'CUSTOM') {
      global_topics_list = data.getAll('global_topics').join(',');
      if (!global_topics_list) global_topics_list = 'NONE';
    }

    if (!title || !category_id) return fail(400, { error: 'Title and Category are required.' });

    try {
      const db = new Database('aidev.db');
      db.prepare(`
        UPDATE topics SET 
          title = ?, category_id = ?, human_description = ?, prompt_text = ?, 
          files_list = ?, components_list = ?, design_tokens = ?, 
          global_topics_list = ?, ignored_parents = ? 
        WHERE id = ?
      `).run(
        title, category_id, human_description, prompt_text,
        files_list, components_list, design_tokens,
        global_topics_list, ignored_parents, params.id
      );
      return { success: true };
    } catch (err) {
      return fail(500, { error: 'Database error' });
    }
  },
  delete: async ({ params }) => {
    try {
      new Database('aidev.db').prepare('DELETE FROM topics WHERE id = ?').run(params.id);
    } catch (err) { }
    throw redirect(303, '/dev/aidev');
  },
  updateCategory: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const name = data.get('name')?.toString().trim();

    if (!id || !name) return fail(400, { error: 'ID and Name are required.' });

    try {
      const db = new Database('aidev.db');
      db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
      return { success: true };
    } catch (err) {
      return fail(500, { error: 'Database error' });
    }
  },
  renameCategory: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const name = data.get('name')?.toString().trim();

    if (!id || !name) return fail(400, { error: 'ID and Name are required.' });

    try {
      const db = new Database('aidev.db');
      db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
      return { success: true };
    } catch (err) {
      return fail(500, { error: 'Database error' });
    }
  },
};