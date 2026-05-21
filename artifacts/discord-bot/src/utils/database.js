/**
 * SQLite database layer using Node.js 24's built-in node:sqlite module.
 * No native compilation needed — bundled with Node.js 22.5+.
 *
 * Tables:
 *   aliases          — email alias records per Discord user
 *   allowed_channels — per-guild channel allowlist for email generation commands
 */

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveDbPath() {
  if (process.env.DATABASE_PATH?.trim()) return process.env.DATABASE_PATH.trim();
  return join(__dirname, '../../data/aliases.db');
}

let db;

export function initDatabase() {
  const dbPath = resolveDbPath();
  const dir = dbPath.substring(0, dbPath.lastIndexOf('/'));
  if (dir) mkdirSync(dir, { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');

  // Core alias table
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

  // Channel allowlist: stores which channels are allowed per guild
  db.exec(`
    CREATE TABLE IF NOT EXISTS allowed_channels (
      guild_id   TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, channel_id)
    );
  `);

  // Migration: add domain column if missing
  const cols = db.prepare('PRAGMA table_info(aliases)').all().map((c) => c.name);
  if (!cols.includes('domain')) db.exec('ALTER TABLE aliases ADD COLUMN domain TEXT;');

  return dbPath;
}

function getDb() {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

// ─── Alias CRUD ───────────────────────────────────────────────────────────────

export function createAlias({ discordUserId, aliasEmail, domain = null, providerId = null }) {
  const result = getDb()
    .prepare('INSERT INTO aliases (discord_user_id, alias_email, domain, provider_id) VALUES (?, ?, ?, ?)')
    .run(discordUserId, aliasEmail, domain, providerId);
  return getDb().prepare('SELECT * FROM aliases WHERE id = ?').get(result.lastInsertRowid);
}

export function getAliasesByUser(discordUserId) {
  return getDb()
    .prepare(`SELECT * FROM aliases WHERE discord_user_id = ? AND status = 'active' ORDER BY created_at DESC`)
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
  return getDb()
    .prepare(`UPDATE aliases SET status = 'deleted' WHERE alias_email = ? AND discord_user_id = ?`)
    .run(aliasEmail, discordUserId).changes > 0;
}

export function aliasExists(aliasEmail) {
  return !!getDb().prepare('SELECT 1 FROM aliases WHERE alias_email = ?').get(aliasEmail);
}

// ─── Allowed Channels ─────────────────────────────────────────────────────────

/**
 * Add a channel to the guild's generation allowlist.
 * INSERT OR IGNORE so duplicates are silently skipped.
 */
export function addAllowedChannel(guildId, channelId) {
  getDb()
    .prepare('INSERT OR IGNORE INTO allowed_channels (guild_id, channel_id) VALUES (?, ?)')
    .run(guildId, channelId);
}

/**
 * Remove a channel from the guild's allowlist.
 * Returns true if a row was removed.
 */
export function removeAllowedChannel(guildId, channelId) {
  return getDb()
    .prepare('DELETE FROM allowed_channels WHERE guild_id = ? AND channel_id = ?')
    .run(guildId, channelId).changes > 0;
}

/**
 * Clear the entire allowlist for a guild (go back to "allow all channels").
 * Returns how many rows were deleted.
 */
export function clearAllowedChannels(guildId) {
  return getDb()
    .prepare('DELETE FROM allowed_channels WHERE guild_id = ?')
    .run(guildId).changes;
}

/**
 * Fetch all channel IDs in the allowlist for a guild.
 * @returns {string[]}
 */
export function getAllowedChannels(guildId) {
  return getDb()
    .prepare('SELECT channel_id FROM allowed_channels WHERE guild_id = ?')
    .all(guildId)
    .map((r) => r.channel_id);
}

/**
 * Check whether a channel is allowed for email generation in a guild.
 *
 * Rules:
 *   - If the allowlist is EMPTY → every channel is allowed (default open)
 *   - If the allowlist has entries → only those channels are allowed
 *
 * @returns {boolean}
 */
export function isChannelAllowed(guildId, channelId) {
  const count = getDb()
    .prepare('SELECT COUNT(*) AS n FROM allowed_channels WHERE guild_id = ?')
    .get(guildId).n;

  // No restrictions configured — allow everywhere
  if (count === 0) return true;

  // Check if this specific channel is in the list
  const row = getDb()
    .prepare('SELECT 1 FROM allowed_channels WHERE guild_id = ? AND channel_id = ?')
    .get(guildId, channelId);
  return !!row;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

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
