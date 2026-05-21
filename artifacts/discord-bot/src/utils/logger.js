/**
 * Simple logger utility.
 * Timestamps every message and prefixes with a level label.
 * All output goes to stdout/stderr so Replit's console captures it.
 */

const timestamp = () => new Date().toISOString();

export const logger = {
  info(msg) {
    console.log(`[${timestamp()}] [INFO]  ${msg}`);
  },
  warn(msg) {
    console.warn(`[${timestamp()}] [WARN]  ${msg}`);
  },
  error(msg) {
    console.error(`[${timestamp()}] [ERROR] ${msg}`);
  },
  /** Log alias lifecycle events — these are the audit-trail entries */
  alias(action, discordUserId, aliasEmail) {
    console.log(
      `[${timestamp()}] [ALIAS] ${action.toUpperCase()} | user=${discordUserId} | alias=${aliasEmail}`,
    );
  },
};
