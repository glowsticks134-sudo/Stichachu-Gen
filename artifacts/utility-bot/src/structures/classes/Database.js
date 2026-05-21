/**
 * Database base class — uses Node.js 24 built-in SQLite (node:sqlite)
 * instead of better-sqlite3 so no native compilation is needed.
 *
 * The public API (.exec, .get, .all, .prepare, .close) is identical to the
 * original better-sqlite3 wrapper, so every repo file (Guild.js, User.js,
 * etc.) works without any changes.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '#utils/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Database {
  constructor(dbPath) {
    this.path = path.resolve(__dirname, '..', '..', dbPath);

    fs.mkdirSync(path.dirname(this.path), { recursive: true });

    try {
      this.db = new DatabaseSync(this.path);
      this.db.exec('PRAGMA journal_mode=WAL');
      this.db.exec('PRAGMA synchronous=NORMAL');
    } catch (error) {
      logger.error('Database', `Failed to connect to ${path.basename(dbPath)}`, error);
      throw error;
    }
  }

  exec(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(...(Array.isArray(params) ? params : [params]));
    } catch (error) {
      logger.error('Database', `Failed to execute SQL: ${sql}`, error);
      throw error;
    }
  }

  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(...(Array.isArray(params) ? params : [params]));
    } catch (error) {
      logger.error('Database', `Failed to get row: ${sql}`, error);
      throw error;
    }
  }

  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...(Array.isArray(params) ? params : [params]));
    } catch (error) {
      logger.error('Database', `Failed to get all rows: ${sql}`, error);
      throw error;
    }
  }

  prepare(sql) {
    try {
      return this.db.prepare(sql);
    } catch (error) {
      logger.error('Database', `Failed to prepare statement: ${sql}`, error);
      throw error;
    }
  }

  close() {
    try {
      this.db.close();
      logger.info('Database', `Closed connection to ${path.basename(this.path)}`);
    } catch (error) {
      logger.error('Database', `Failed to close connection to ${path.basename(this.path)}`, error);
    }
  }
}
