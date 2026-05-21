/**
 * SQLite database layer using Node.js 24's built-in node:sqlite module.
 *
 * No native compilation needed — node:sqlite is bundled with Node.js 22.5+
 * and is stable (unflagged) in Node.js 24.
 *
 * Schema:
 *   aliases  — one row per email alias, keyed by the Discord user ID
 *
 * The API is synchronous (similar to better-sqlite3), which is fine for a
 * bot that handles one slash-command interaction at a time.
 */

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store the database file in the data/ directory (gitignored)
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'aliases.db');

let db;

/**
 * Initialise the database connection and create the table if it doesn't exist.
 * Call this once at startup before using any other function.
 */
export function initDatabase() {
  // Ensure the data directory exists
  mkdirSync(DATA_DIR, { recursive: true });

  db = new DatabaseSync(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.exec("PRAGMA journal_mode = WAL;");

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDb() {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

/**
 * Insert a new alias record.
 * @returns {object} The inserted row
 */
export function createAlias({ discordUserId, aliasEmail, providerId = null }) {
  const stmt = getDb().prepare(`
    INSERT INTO aliases (discord_user_id, alias_email, provider_id)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(discordUserId, aliasEmail, providerId);
  return getDb()
    .prepare('SELECT * FROM aliases WHERE id = ?')
    .get(result.lastInsertRowid);
}

/**
 * Fetch all active aliases for a Discord user.
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
 * Fetch a single alias by its email address.
 */
export function getAliasByEmail(aliasEmail) {
  return getDb()
    .prepare('SELECT * FROM aliases WHERE alias_email = ?')
    .get(aliasEmail);
}

/**
 * Count how many active aliases a user currently owns.
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
 * Mark an alias as deleted (soft delete so we retain history).
 * Returns true if a row was updated, false if nothing matched.
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
 * Check whether an alias email already exists in the database (any status).
 */
export function aliasExists(aliasEmail) {
  const row = getDb()
    .prepare('SELECT 1 FROM aliases WHERE alias_email = ?')
    .get(aliasEmail);
  return !!row;
}
