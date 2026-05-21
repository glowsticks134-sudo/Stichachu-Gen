/**
 * SQLite database layer using Node.js 24's built-in node:sqlite module.
 * No native compilation needed — bundled with Node.js 22.5+.
 *
 * DATABASE_PATH env var controls where the .db file lives.
 * On Railway: mount a Volume at /data and set DATABASE_PATH=/data/aliases.db
 * so data survives redeploys. Without a volume the file sits in data/ locally.
 */

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the database file path.
// Priority: DATABASE_PATH env var → default local data/ folder
function resolveDbPath() {
  if (process.env.DATABASE_PATH && process.env.DATABASE_PATH.trim()) {
    return process.env.DATABASE_PATH.trim();
  }
  return join(__dirname, '../../data/aliases.db');
}

let db;

export function initDatabase() {
  const dbPath = resolveDbPath();

  // Ensure the parent directory exists (important for Railway volume paths)
  const dir = dbPath.substring(0, dbPath.lastIndexOf('/'));
  if (dir) mkdirSync(dir, { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');

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

  // Migration: add domain column if missing (for databases created before this column existed)
  const cols = db.prepare('PRAGMA table_info(aliases)').all().map((c) => c.name);
  if (!cols.includes('domain')) {
    db.exec('ALTER TABLE aliases ADD COLUMN domain TEXT;');
  }

  return dbPath; // Return so index.js can log the active path
}

function getDb() {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

export function createAlias({ discordUserId, aliasEmail, domain = null, providerId = null }) {
  const stmt = getDb().prepare(
    'INSERT INTO aliases (discord_user_id, alias_email, domain, provider_id) VALUES (?, ?, ?, ?)',
  );
  const result = stmt.run(discordUserId, aliasEmail, domain, providerId);
  return getDb().prepare('SELECT * FROM aliases WHERE id = ?').get(result.lastInsertRowid);
}

export function getAliasesByUser(discordUserId) {
  return getDb()
    .prepare(
      `SELECT * FROM aliases
       WHERE discord_user_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
    )
    .all(discordUserId);
}

export function getAliasByEmail(aliasEmail) {
  return getDb().prepare('SELECT * FROM aliases WHERE alias_email = ?').get(aliasEmail);
}

export function countActiveAliases(discordUserId) {
  return getDb()
    .prepare(`SELECT COUNT(*) AS n FROM aliases WHERE discord_user_id = ? AND status = 'active'`)
    .get(discordUserId).n;
}

export function deleteAlias(aliasEmail, discordUserId) {
  const result = getDb()
    .prepare(
      `UPDATE aliases SET status = 'deleted' WHERE alias_email = ? AND discord_user_id = ?`,
    )
    .run(aliasEmail, discordUserId);
  return result.changes > 0;
}

export function aliasExists(aliasEmail) {
  return !!getDb().prepare('SELECT 1 FROM aliases WHERE alias_email = ?').get(aliasEmail);
}

export function getStats() {
  const d = getDb();
  const totalActive = d.prepare(`SELECT COUNT(*) AS n FROM aliases WHERE status = 'active'`).get().n;
  const totalAllTime = d.prepare(`SELECT COUNT(*) AS n FROM aliases`).get().n;
  const uniqueUsers = d.prepare(`SELECT COUNT(DISTINCT discord_user_id) AS n FROM aliases WHERE status = 'active'`).get().n;
  const last24h = d.prepare(
    `SELECT COUNT(*) AS n FROM aliases
     WHERE status = 'active'
       AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', datetime('now', '-1 day'))`,
  ).get().n;
  const byDomain = d.prepare(
    `SELECT domain, COUNT(*) AS n FROM aliases
     WHERE status = 'active' AND domain IS NOT NULL
     GROUP BY domain ORDER BY n DESC LIMIT 5`,
  ).all();
  return { totalActive, totalAllTime, uniqueUsers, last24h, byDomain };
}
