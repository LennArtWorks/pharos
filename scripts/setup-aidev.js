import Database from 'better-sqlite3';

const db = new Database('aidev.db');

// Quick migration for existing databases
try {
  db.exec(`ALTER TABLE topics ADD COLUMN global_topics_list TEXT DEFAULT 'ALL';`);
  console.log("Migration: Added global_topics_list column to existing topics table.");
} catch (e) {
  // If the column already exists, SQLite throws an error, which we just silently ignore here.
}

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
    design_tokens TEXT,
    global_topics_list TEXT DEFAULT 'ALL', -- NEW: Stores 'ALL', 'NONE', or comma-separated global topic IDs
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES topics (id) ON DELETE CASCADE
  );
`);
console.log("DB schema verified.");


// import Database from 'better-sqlite3';
// const db = new Database('aidev.db');

// try {
//   db.exec(`ALTER TABLE topics ADD COLUMN human_description TEXT DEFAULT '';`);
//   db.exec(`ALTER TABLE topics ADD COLUMN ignored_parents TEXT DEFAULT '';`);
//   console.log("Migration: Added human_description and ignored_parents columns.");
// } catch (e) {
//   // Ignore if already added
// }