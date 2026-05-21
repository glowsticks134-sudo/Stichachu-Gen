/**
 * Domain configuration utility.
 *
 * Reads DOMAIN_COMMANDS from .env — a comma-separated list of prefix:domain pairs.
 *
 * Example:
 *   DOMAIN_COMMANDS=lgen:larpers.cc,ngen:nachtmail.online,dgen:dxdmail.cc
 *
 * Each entry creates a slash command /lgen, /ngen, /dgen that generates
 * an alias on that specific domain.
 *
 * Also reads DOMAINS (just domain list, no prefixes) for /gen random selection.
 */

/**
 * Returns an array of { prefix, domain } objects for domain-specific commands.
 * @returns {{ prefix: string, domain: string }[]}
 */
export function getDomainCommands() {
  const raw = process.env.DOMAIN_COMMANDS || '';
  if (!raw.trim()) return [];

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colonIdx = entry.indexOf(':');
      if (colonIdx === -1) {
        console.warn(`[domains] Skipping malformed DOMAIN_COMMANDS entry: "${entry}"`);
        return null;
      }
      const prefix = entry.slice(0, colonIdx).trim().toLowerCase();
      const domain = entry.slice(colonIdx + 1).trim().toLowerCase();
      return { prefix, domain };
    })
    .filter(Boolean);
}

/**
 * Returns the full list of domains available for random generation (/gen).
 * If DOMAINS is set, uses that. Otherwise falls back to the domains in DOMAIN_COMMANDS.
 * @returns {string[]}
 */
export function getAllDomains() {
  // Explicit DOMAINS env var takes priority
  if (process.env.DOMAINS) {
    return process.env.DOMAINS.split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  // Fall back to domains derived from DOMAIN_COMMANDS
  const cmds = getDomainCommands();
  if (cmds.length > 0) return cmds.map((c) => c.domain);

  // Fall back to the single EMAIL_DOMAIN
  if (process.env.EMAIL_DOMAIN) return [process.env.EMAIL_DOMAIN];

  return [];
}

/**
 * Pick a random domain from the full domain list.
 * @returns {string}
 */
export function randomDomain() {
  const domains = getAllDomains();
  if (domains.length === 0) {
    throw new Error(
      'No domains configured. Set DOMAIN_COMMANDS or EMAIL_DOMAIN in your .env file.',
    );
  }
  return domains[Math.floor(Math.random() * domains.length)];
}
