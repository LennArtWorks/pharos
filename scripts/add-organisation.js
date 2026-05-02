import Database from 'better-sqlite3';
import crypto from 'crypto';
import 'dotenv/config'; // Loads variables from .env automatically

const db = new Database('organisations.db');

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    roles_json TEXT
  );
`);

// --- Encryption Setup ---
const ALGORITHM = 'aes-256-gcm';
// Hashes your JWT_SECRET to ensure it is exactly 32 bytes long, which AES-256 requires
const SECRET_KEY = crypto.createHash('sha256').update(String(process.env.DATABASE_ENCRYPTION_KEY)).digest('base64').substring(0, 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store the Initialization Vector, Auth Tag, and Encrypted string together
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// --- Database Insertion ---
const insert = db.prepare(`
  INSERT INTO organisations (
    organisation_id, subdomain, organization_name, cloud_name, cloud_url, cloud_username, cloud_password_encrypted, cloud_directory
  )
  VALUES (
    @organisation_id, @subdomain, @organization_name, @cloud_name, @cloud_url, @cloud_username, @cloud_password_encrypted, @cloud_directory
  )
`);

// --- Database Update ---
const update = db.prepare(`
  UPDATE organisations 
  SET cloud_url = @cloud_url, 
      cloud_password_encrypted = @cloud_password_encrypted 
  WHERE subdomain = @subdomain
`);

// 1. Add your first organisation
insert.run({
  organisation_id: `orga_${Date.now()}`,
  subdomain: 'fsr07',
  organization_name: 'FSR-07',
  cloud_name: 'sciebo',
  cloud_url: 'https://fh-muenster.sciebo.de/remote.php/webdav/',
  cloud_username: 'la117415@fh-muenster.de',
  cloud_password_encrypted: encrypt('WDeTq-2Wo6W-bF99x-mWCar-WGg36'),
  cloud_directory: 'Pharos'
});

// 2. Add a second organisation by just running it again
// insert.run({
//   organisation_id: `orga_${Date.now() + 1}`, // +1 prevents primary key collision if running in the same millisecond
//   subdomain: 'design',
//   organization_name: 'FSR Design',
//   cloud_name: 'sciebo',
//   cloud_url: 'https://uni-muenster.sciebo.de/remote.php/webdav/',
//   cloud_username: 'design_admin@...',
//   cloud_password_encrypted: encrypt('SECOND_PLAIN_TEXT_PASSWORD_HERE'),
//   cloud_directory: 'Pharos'
// });

console.log('Organisations added securely.');