import Database from 'better-sqlite3';

// Initialize the SQLite database file
const db = new Database('organisations.db', { verbose: console.log });

// Initialize the schema if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS organisations (
    organisation_id TEXT PRIMARY KEY,
    subdomain TEXT UNIQUE NOT NULL,
    organization_name TEXT NOT NULL,
    cloud_name TEXT NOT NULL,
    cloud_url TEXT NOT NULL,
    cloud_username TEXT NOT NULL,
    cloud_password_encrypted TEXT NOT NULL,
    cloud_directory TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;