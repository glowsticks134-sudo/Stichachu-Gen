import { Database } from "#structures/classes/Database";
import { logger } from "#utils/logger";

export class Settings extends Database {
  constructor() {
    super("./database/data/settings.bread");
    this.initTables();
  }

  initTables() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        autorole_id TEXT DEFAULT NULL,
        welcome_channel_id TEXT DEFAULT NULL,
        welcome_message TEXT DEFAULT NULL,
        welcome_embed INTEGER DEFAULT 1,
        goodbye_channel_id TEXT DEFAULT NULL,
        goodbye_message TEXT DEFAULT NULL,
        goodbye_embed INTEGER DEFAULT 1,
        boost_channel_id TEXT DEFAULT NULL,
        boost_message TEXT DEFAULT NULL,
        modlog_channel_id TEXT DEFAULT NULL,
        joinlog_channel_id TEXT DEFAULT NULL,
        autopublish_enabled INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS selfroles (
        guild_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, role_id)
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS autopings (
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, channel_id)
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS autopublish_channels (
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, channel_id)
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS guild_logs (
        guild_id TEXT NOT NULL,
        log_type TEXT NOT NULL,
        channel_id TEXT,
        PRIMARY KEY (guild_id, log_type)
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS starboard (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        threshold INTEGER DEFAULT 3
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS counting (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        current_count INTEGER DEFAULT 0,
        last_user_id TEXT
      )
    `);

    // Migrate existing guild_settings table if needed
    try { this.exec("ALTER TABLE guild_settings ADD COLUMN snipe_enabled INTEGER DEFAULT 1"); } catch {}
  }

  ensureGuild(guildId) {
    const existing = this.get("SELECT guild_id FROM guild_settings WHERE guild_id = ?", [guildId]);
    if (!existing) {
      this.exec("INSERT INTO guild_settings (guild_id) VALUES (?)", [guildId]);
    }
  }

  getSettings(guildId) {
    this.ensureGuild(guildId);
    return this.get("SELECT * FROM guild_settings WHERE guild_id = ?", [guildId]);
  }

  setSetting(guildId, key, value) {
    this.ensureGuild(guildId);
    this.exec(`UPDATE guild_settings SET ${key} = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`, [value, guildId]);
  }

  // Autorole
  getAutorole(guildId) { return this.getSettings(guildId)?.autorole_id || null; }
  setAutorole(guildId, roleId) { this.setSetting(guildId, "autorole_id", roleId); }
  clearAutorole(guildId) { this.setSetting(guildId, "autorole_id", null); }

  // Welcome
  getWelcome(guildId) {
    const s = this.getSettings(guildId);
    return { channel: s?.welcome_channel_id, message: s?.welcome_message, embed: s?.welcome_embed };
  }
  setWelcome(guildId, channelId, message) {
    this.ensureGuild(guildId);
    this.exec("UPDATE guild_settings SET welcome_channel_id = ?, welcome_message = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?", [channelId, message, guildId]);
  }
  clearWelcome(guildId) {
    this.ensureGuild(guildId);
    this.exec("UPDATE guild_settings SET welcome_channel_id = NULL, welcome_message = NULL WHERE guild_id = ?", [guildId]);
  }

  // Goodbye
  getGoodbye(guildId) {
    const s = this.getSettings(guildId);
    return { channel: s?.goodbye_channel_id, message: s?.goodbye_message, embed: s?.goodbye_embed };
  }
  setGoodbye(guildId, channelId, message) {
    this.ensureGuild(guildId);
    this.exec("UPDATE guild_settings SET goodbye_channel_id = ?, goodbye_message = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?", [channelId, message, guildId]);
  }
  clearGoodbye(guildId) {
    this.ensureGuild(guildId);
    this.exec("UPDATE guild_settings SET goodbye_channel_id = NULL, goodbye_message = NULL WHERE guild_id = ?", [guildId]);
  }

  // Boost
  getBoost(guildId) {
    const s = this.getSettings(guildId);
    return { channel: s?.boost_channel_id, message: s?.boost_message };
  }
  setBoost(guildId, channelId, message) {
    this.ensureGuild(guildId);
    this.exec("UPDATE guild_settings SET boost_channel_id = ?, boost_message = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?", [channelId, message, guildId]);
  }

  // Modlog
  getModlog(guildId) { return this.getSettings(guildId)?.modlog_channel_id || null; }
  setModlog(guildId, channelId) { this.setSetting(guildId, "modlog_channel_id", channelId); }
  clearModlog(guildId) { this.setSetting(guildId, "modlog_channel_id", null); }

  // Joinlog
  getJoinlog(guildId) { return this.getSettings(guildId)?.joinlog_channel_id || null; }
  setJoinlog(guildId, channelId) { this.setSetting(guildId, "joinlog_channel_id", channelId); }
  clearJoinlog(guildId) { this.setSetting(guildId, "joinlog_channel_id", null); }

  // Selfroles
  addSelfrole(guildId, roleId) {
    this.exec("INSERT OR IGNORE INTO selfroles (guild_id, role_id) VALUES (?, ?)", [guildId, roleId]);
  }
  removeSelfrole(guildId, roleId) {
    this.exec("DELETE FROM selfroles WHERE guild_id = ? AND role_id = ?", [guildId, roleId]);
  }
  getSelfroles(guildId) {
    return this.all("SELECT role_id FROM selfroles WHERE guild_id = ?", [guildId]).map(r => r.role_id);
  }
  isSelfrole(guildId, roleId) {
    return !!this.get("SELECT role_id FROM selfroles WHERE guild_id = ? AND role_id = ?", [guildId, roleId]);
  }

  // Autopings
  setAutoping(guildId, channelId, roleId) {
    this.exec("INSERT OR REPLACE INTO autopings (guild_id, channel_id, role_id) VALUES (?, ?, ?)", [guildId, channelId, roleId]);
  }
  removeAutoping(guildId, channelId) {
    this.exec("DELETE FROM autopings WHERE guild_id = ? AND channel_id = ?", [guildId, channelId]);
  }
  getAutoping(guildId, channelId) {
    return this.get("SELECT role_id FROM autopings WHERE guild_id = ? AND channel_id = ?", [guildId, channelId]);
  }
  getAllAutopings(guildId) {
    return this.all("SELECT channel_id, role_id FROM autopings WHERE guild_id = ?", [guildId]);
  }

  // Autopublish channels
  addAutopublish(guildId, channelId) {
    this.exec("INSERT OR IGNORE INTO autopublish_channels (guild_id, channel_id) VALUES (?, ?)", [guildId, channelId]);
  }
  removeAutopublish(guildId, channelId) {
    this.exec("DELETE FROM autopublish_channels WHERE guild_id = ? AND channel_id = ?", [guildId, channelId]);
  }
  getAutopublishChannels(guildId) {
    return this.all("SELECT channel_id FROM autopublish_channels WHERE guild_id = ?", [guildId]).map(r => r.channel_id);
  }
  isAutopublish(guildId, channelId) {
    return !!this.get("SELECT channel_id FROM autopublish_channels WHERE guild_id = ? AND channel_id = ?", [guildId, channelId]);
  }

  // Notes
  addNote(guildId, userId, moderatorId, note) {
    this.exec("INSERT INTO user_notes (guild_id, user_id, moderator_id, note) VALUES (?, ?, ?, ?)", [guildId, userId, moderatorId, note]);
  }
  getNotes(guildId, userId) {
    return this.all("SELECT * FROM user_notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC", [guildId, userId]);
  }
  deleteNote(id, guildId) {
    this.exec("DELETE FROM user_notes WHERE id = ? AND guild_id = ?", [id, guildId]);
  }
  clearNotes(guildId, userId) {
    this.exec("DELETE FROM user_notes WHERE guild_id = ? AND user_id = ?", [guildId, userId]);
  }

  // Starboard
  getStarboard(guildId) {
    return this.get("SELECT * FROM starboard WHERE guild_id = ?", [guildId]);
  }
  setStarboard(guildId, channelId, threshold = 3) {
    this.exec("INSERT OR REPLACE INTO starboard (guild_id, channel_id, threshold) VALUES (?, ?, ?)", [guildId, channelId, threshold]);
  }

  // Counting
  getCounting(guildId) {
    return this.get("SELECT * FROM counting WHERE guild_id = ?", [guildId]);
  }
  setCounting(guildId, channelId) {
    if (!channelId) {
      this.exec("DELETE FROM counting WHERE guild_id = ?", [guildId]);
      return;
    }
    this.exec("INSERT OR REPLACE INTO counting (guild_id, channel_id, current_count, last_user_id) VALUES (?, ?, 0, NULL)", [guildId, channelId]);
  }
  updateCount(guildId, count, userId) {
    this.exec("UPDATE counting SET current_count = ?, last_user_id = ? WHERE guild_id = ?", [count, userId, guildId]);
  }

  // Guild Logs
  setLog(guildId, logType, channelId) {
    if (!channelId) {
      this.exec("DELETE FROM guild_logs WHERE guild_id = ? AND log_type = ?", [guildId, logType]);
      return;
    }
    this.exec("INSERT OR REPLACE INTO guild_logs (guild_id, log_type, channel_id) VALUES (?, ?, ?)", [guildId, logType, channelId]);
  }
  getLog(guildId, logType) {
    return this.get("SELECT channel_id FROM guild_logs WHERE guild_id = ? AND log_type = ?", [guildId, logType])?.channel_id || null;
  }
  getAllLogs(guildId) {
    return this.all("SELECT log_type, channel_id FROM guild_logs WHERE guild_id = ?", [guildId]);
  }
}
