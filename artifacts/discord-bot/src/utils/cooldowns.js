/**
 * In-memory cooldown tracker.
 *
 * Stores the last time each Discord user ran each command so we can
 * enforce per-command cooldowns without hitting the database.
 *
 * Structure:  cooldownMap  →  Map< commandName, Map< userId, timestamp > >
 */

// Top-level map keyed by command name
const cooldownMap = new Map();

/**
 * Check whether a user is still within a cooldown period.
 *
 * @param {string} commandName  - The slash command name (e.g. "createemail")
 * @param {string} userId       - The Discord user's ID
 * @param {number} cooldownSecs - How long the cooldown lasts in seconds
 * @returns {{ onCooldown: boolean, remainingSecs: number }}
 */
export function checkCooldown(commandName, userId, cooldownSecs) {
  if (!cooldownMap.has(commandName)) {
    cooldownMap.set(commandName, new Map());
  }

  const userTimestamps = cooldownMap.get(commandName);
  const now = Date.now();
  const cooldownMs = cooldownSecs * 1000;

  if (userTimestamps.has(userId)) {
    const lastUsed = userTimestamps.get(userId);
    const elapsed = now - lastUsed;

    if (elapsed < cooldownMs) {
      const remainingSecs = Math.ceil((cooldownMs - elapsed) / 1000);
      return { onCooldown: true, remainingSecs };
    }
  }

  return { onCooldown: false, remainingSecs: 0 };
}

/**
 * Record that a user just used a command, resetting their cooldown timer.
 *
 * @param {string} commandName
 * @param {string} userId
 */
export function setCooldown(commandName, userId) {
  if (!cooldownMap.has(commandName)) {
    cooldownMap.set(commandName, new Map());
  }
  cooldownMap.get(commandName).set(userId, Date.now());
}

/**
 * Prune stale entries to prevent unbounded memory growth.
 * Call this occasionally (e.g. every hour via setInterval).
 *
 * @param {number} maxAgeSecs - Remove entries older than this many seconds
 */
export function pruneStaleEntries(maxAgeSecs = 3600) {
  const cutoff = Date.now() - maxAgeSecs * 1000;
  for (const [, userTimestamps] of cooldownMap) {
    for (const [userId, timestamp] of userTimestamps) {
      if (timestamp < cutoff) userTimestamps.delete(userId);
    }
  }
}

// Auto-prune every hour so memory doesn't grow indefinitely
setInterval(() => pruneStaleEntries(), 60 * 60 * 1000);
