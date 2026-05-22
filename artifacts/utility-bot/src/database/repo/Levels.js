import { Database } from '#structures/classes/Database';
import { config } from '#config/config';
import { logger } from '#utils/logger';

/**
 * XP leveling formula — matches MEE6's curve.
 * XP required to go from level N to N+1: 5*N² + 50*N + 100
 */
export function xpForNextLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/** Total cumulative XP required to reach a given level from 0. */
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpForNextLevel(i);
  return total;
}

/** Derive current level from total XP. */
export function getLevelFromXp(xp) {
  let level = 0;
  while (totalXpForLevel(level + 1) <= xp) level++;
  return level;
}

export class Levels extends Database {
  constructor() {
    super(config.database.levels);
    this.initTable();
  }

  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS levels (
        user_id    TEXT    NOT NULL,
        guild_id   TEXT    NOT NULL,
        xp         INTEGER DEFAULT 0,
        level      INTEGER DEFAULT 0,
        last_xp_at INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, guild_id)
      )
    `);
    this.exec(
      `CREATE INDEX IF NOT EXISTS idx_levels_guild_xp ON levels (guild_id, xp DESC)`,
    );
    logger.info('LevelsDatabase', 'Levels table initialized');
  }

  getUser(userId, guildId) {
    return this.get(
      'SELECT * FROM levels WHERE user_id = ? AND guild_id = ?',
      [userId, guildId],
    );
  }

  ensureUser(userId, guildId) {
    const user = this.getUser(userId, guildId);
    if (!user) {
      this.exec(
        'INSERT INTO levels (user_id, guild_id) VALUES (?, ?)',
        [userId, guildId],
      );
      return this.getUser(userId, guildId);
    }
    return user;
  }

  addXp(userId, guildId, amount) {
    this.ensureUser(userId, guildId);
    this.exec(
      'UPDATE levels SET xp = xp + ?, last_xp_at = ? WHERE user_id = ? AND guild_id = ?',
      [amount, Date.now(), userId, guildId],
    );
    return this.getUser(userId, guildId);
  }

  setLevel(userId, guildId, level) {
    this.exec(
      'UPDATE levels SET level = ? WHERE user_id = ? AND guild_id = ?',
      [level, userId, guildId],
    );
  }

  /** 1-based rank of the user in the guild by XP. */
  getRank(userId, guildId) {
    const result = this.get(
      `SELECT COUNT(*) + 1 AS rank FROM levels
       WHERE guild_id = ? AND xp > COALESCE(
         (SELECT xp FROM levels WHERE user_id = ? AND guild_id = ?), -1
       )`,
      [guildId, userId, guildId],
    );
    return result?.rank ?? null;
  }

  getLeaderboard(guildId, limit = 10, offset = 0) {
    return this.all(
      'SELECT * FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ? OFFSET ?',
      [guildId, limit, offset],
    );
  }

  getTotalUsers(guildId) {
    const result = this.get(
      'SELECT COUNT(*) AS n FROM levels WHERE guild_id = ?',
      [guildId],
    );
    return result?.n ?? 0;
  }

  /** Returns true if the user is outside the XP cooldown window. */
  canEarnXp(userId, guildId, cooldownMs = 60_000) {
    const user = this.getUser(userId, guildId);
    if (!user) return true;
    return Date.now() - (user.last_xp_at || 0) >= cooldownMs;
  }
}
