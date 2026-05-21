/**
 * SQLite database layer using Node.js 24's built-in node:sqlite module.
 *
 * No native compilation needed — node:sqlite is bundled with Node.js 22.5+
 * and is stable (unflagged) in Node.js 24.
 *
 * Schema:
 *   aliases  — one row per email alias, keyed by the Discord user ID
 */

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'aliases.db');

let db;

/**
 * Initialise the database and run any pending migrations.
 * Call once at startup before using any other function.
 */
export function initDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');

  // Create the table if it doesn't exist (initial schema)
  db.exec(`
    CREATE TABLE IF NOT EXISTS aliases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_user_id TEXT    NOT NULL,
      alias_email     TEXT    NOT NULL UNIQUE,
      provider_id     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      status          TEXT    NOT NULL DEFAULT 'active'
    );
    CREATE INDEX IF NOT EXISTS idx_aliases_user ON aliases (discord_user_id);
  `);

  // Migration: add domain column if it doesn't already exist
  const columns = db
    .prepare("PRAGMA table_info(aliases)")
    .all()
    .map((c) => c.name);

  if (!columns.includes('domain')) {
    db.exec("ALTER TABLE aliases ADD COLUMN domain TEXT;");
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

/**
 * Insert a new alias record.
 */
export function createAlias({ discordUserId, aliasEmail, domain = null, providerId = null }) {
  const stmt = getDb().prepare(`
    INSERT INTO aliases (discord_user_id, alias_email, domain, provider_id)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(discordUserId, aliasEmail, domain, providerId);
  return getDb()
    .prepare('SELECT * FROM aliases WHERE id = ?')
    .get(result.lastInsertRowid);
}

/**
 * Fetch all active aliases for a Discord user, newest first.
 */
export function getAliasesByUser(discordUserId) {
  return getDb()
    .prepare(
      `SELECT * FROM aliases
       WHERE discord_user_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
    )
    .all(discordUserId);
}

/**
 * Fetch a single alias record by its email address (any status).
 */
export function getAliasByEmail(aliasEmail) {
  return getDb()
    .prepare('SELECT * FROM aliases WHERE alias_email = ?')
    .get(aliasEmail);
}

/**
 * Count active aliases owned by a user.
 */
export function countActiveAliases(discordUserId) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS total FROM aliases
       WHERE discord_user_id = ? AND status = 'active'`,
    )
    .get(discordUserId);
  return row.total;
}

/**
 * Soft-delete an alias. Returns true if a row was updated.
 */
export function deleteAlias(aliasEmail, discordUserId) {
  const result = getDb()
    .prepare(
      `UPDATE aliases SET status = 'deleted'
       WHERE alias_email = ? AND discord_user_id = ?`,
    )
    .run(aliasEmail, discordUserId);
  return result.changes > 0;
}

/**
 * Check whether an alias email already exists (any status).
 */
export function aliasExists(aliasEmail) {
  const row = getDb()
    .prepare('SELECT 1 FROM aliases WHERE alias_email = ?')
    .get(aliasEmail);
  return !!row;
}
