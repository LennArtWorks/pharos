import Database from 'better-sqlite3';

const db = new Database('aidev.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_global INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL,
    prompt_text TEXT,
    files_list TEXT,
    components_list TEXT, 
    design_tokens TEXT, -- NEW: Stores e.g. "colors,icons"
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES topics (id) ON DELETE CASCADE
  );
`);
console.log("DB schema verified.");