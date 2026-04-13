import Database from 'better-sqlite3';

// Initialize the SQLite database file
const db = new Database('databases/organisations.db');

// Enable foreign keys for cascading deletes
db.pragma('foreign_keys = ON');

// Initialize the schema if it doesn't exist
db.exec(`
  -- 1. Organisations TABLE (Existing)
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
    roles_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. SESSIONS TABLE
  -- Maps a secure browser cookie to an account in the WebDAV registry
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- The secure, random session token
    organisation_id TEXT NOT NULL,
    account_id TEXT NOT NULL, -- Maps to e.g., 'usr_123456' in accounts.fsrsecure
    expires_at INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organisation_id) REFERENCES organisations (organisation_id) ON DELETE CASCADE
  );

  -- 3. VERIFICATION TOKENS TABLE
  -- Short-lived tokens for Magic Links, OTPs, or Password Reset flows
  CREATE TABLE IF NOT EXISTS verification_tokens (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL,
    identifier TEXT NOT NULL, -- The user's email address
    token_hash TEXT NOT NULL, -- Hashed OTP or Magic Link token
    type TEXT NOT NULL, -- e.g., 'magic_link', 'otp', 'setup'
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (organisation_id) REFERENCES organisations (organisation_id) ON DELETE CASCADE
  );

  -- 4. ANTI-RAID / RATE LIMITING TABLE
  -- Tracks login/auth attempts to block IPs or identifiers that spam the server
  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY, -- Combination of IP + Endpoint + Organisation (e.g., '192.168.1.1:/login:org_123')
    hits INTEGER DEFAULT 1,
    window_start INTEGER NOT NULL -- Timestamp of the first request in the current window
  );

  -- 5. AUDIT LOGS (GOD MODE ACCOUNTABILITY)
  -- Tracks all critical actions taken by Platform Operators
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organisation_id TEXT, -- Can be NULL if it's a global action
    operator_email TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g., 'SIMULATE_ROLE', 'DELETE_ORG', 'FLUSH_CACHE'
    details TEXT, -- JSON string with extra context (e.g., '{"simulated_role": "Guest"}')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;