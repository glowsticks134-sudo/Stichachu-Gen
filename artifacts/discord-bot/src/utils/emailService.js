/**
 * Email Service — abstraction over two providers:
 *
 *   SIMPLELOGIN  — uses the SimpleLogin REST API to create/delete aliases on
 *                  your custom domain. Requires a SimpleLogin account + API key.
 *
 *   CLOUDFLARE   — uses the Cloudflare Email Routing API to create/delete
 *                  individual routing rules on your zone. Requires a Cloudflare
 *                  API token with "Email Routing Rules: Edit" permission.
 *
 *   LOCAL        — no external API calls; generates a random alias and stores
 *                  it only in SQLite. Useful for testing or if you manage
 *                  forwarding via a catch-all rule externally.
 *
 * Set EMAIL_PROVIDER=simplelogin|cloudflare|local in your .env file.
 */

import axios from 'axios';

const PROVIDER = (process.env.EMAIL_PROVIDER || 'local').toLowerCase();

// ─── Random alias prefix generator ───────────────────────────────────────────

const ADJECTIVES = [
  'swift', 'bright', 'calm', 'bold', 'keen', 'pure', 'vast', 'wise',
  'cool', 'dark', 'fair', 'free', 'glad', 'gold', 'good', 'gray',
  'hard', 'high', 'kind', 'long', 'loud', 'mild', 'neat', 'nice',
];
const NOUNS = [
  'fox', 'oak', 'ray', 'sky', 'sea', 'bay', 'ash', 'elm',
  'arc', 'dew', 'eve', 'fin', 'gem', 'gum', 'hay', 'ice',
  'ivy', 'jay', 'jet', 'key', 'koi', 'law', 'lea', 'log',
];

/**
 * Generate a random alias prefix like "swiftfox4721".
 * Kept short and readable while still being practically unique.
 */
function generatePrefix() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${adj}${noun}${num}`;
}

// ─── SimpleLogin provider ─────────────────────────────────────────────────────

/**
 * Create a new alias on SimpleLogin using a custom domain suffix.
 *
 * SimpleLogin API docs: https://app.simplelogin.io/docs/api/
 *
 * The domain must already be added and verified in your SimpleLogin account.
 * SimpleLogin will return a signed suffix — we request it fresh each time.
 *
 * @returns {{ aliasEmail: string, providerId: string }}
 */
async function simpleLoginCreate() {
  const apiKey = process.env.SIMPLELOGIN_API_KEY;
  const domain = process.env.EMAIL_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error('SIMPLELOGIN_API_KEY and EMAIL_DOMAIN must be set in .env');
  }

  // Step 1: Fetch available suffixes for the custom domain
  const suffixRes = await axios.get(
    'https://app.simplelogin.io/api/v5/alias/options',
    {
      headers: { Authentication: apiKey },
      params: { hostname: domain },
    },
  );

  // Find the signed suffix that matches our custom domain
  const suffixEntry = suffixRes.data.suffixes?.find((s) =>
    s.suffix.endsWith(`@${domain}`),
  );

  if (!suffixEntry) {
    throw new Error(
      `Domain "${domain}" not found in your SimpleLogin account. ` +
      'Make sure you have added and verified it at https://app.simplelogin.io/dashboard/custom_domain',
    );
  }

  // Step 2: Create the alias with a random prefix
  const prefix = generatePrefix();
  const createRes = await axios.post(
    'https://app.simplelogin.io/api/v3/alias/custom/new',
    {
      alias_prefix: prefix,
      signed_suffix: suffixEntry.signed_suffix,
      // Send to your catch-all mailbox (first mailbox in the account)
      mailbox_ids: [suffixRes.data.recommendation?.mailbox_id].filter(Boolean),
    },
    { headers: { Authentication: apiKey } },
  );

  return {
    aliasEmail: createRes.data.email,
    providerId: String(createRes.data.id),
  };
}

/**
 * Delete (disable) a SimpleLogin alias by its provider ID.
 */
async function simpleLoginDelete(providerId) {
  const apiKey = process.env.SIMPLELOGIN_API_KEY;
  if (!apiKey) throw new Error('SIMPLELOGIN_API_KEY must be set in .env');

  // SimpleLogin soft-deletes aliases; DELETE removes it entirely
  await axios.delete(`https://app.simplelogin.io/api/aliases/${providerId}`, {
    headers: { Authentication: apiKey },
  });
}

// ─── Cloudflare Email Routing provider ───────────────────────────────────────

/**
 * Create an email routing rule on Cloudflare that forwards prefix@domain
 * to the destination address set in CLOUDFLARE_DESTINATION_EMAIL.
 *
 * Cloudflare API docs:
 * https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
 * https://developers.cloudflare.com/api/operations/email-routing-routing-rules-create-routing-rule
 *
 * @returns {{ aliasEmail: string, providerId: string }}
 */
async function cloudflareCreate() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const domain = process.env.EMAIL_DOMAIN;
  const destination = process.env.CLOUDFLARE_DESTINATION_EMAIL;

  if (!token || !zoneId || !domain || !destination) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, EMAIL_DOMAIN, and ' +
      'CLOUDFLARE_DESTINATION_EMAIL must all be set in .env',
    );
  }

  const prefix = generatePrefix();
  const aliasEmail = `${prefix}@${domain}`;

  const res = await axios.post(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
    {
      name: `alias-${prefix}`,
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: aliasEmail }],
      actions: [{ type: 'forward', value: [destination] }],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.data.success) {
    throw new Error(
      `Cloudflare API error: ${JSON.stringify(res.data.errors)}`,
    );
  }

  return {
    aliasEmail,
    providerId: res.data.result.tag, // Cloudflare uses a tag as the rule ID
  };
}

/**
 * Delete a Cloudflare email routing rule by its tag (provider ID).
 */
async function cloudflareDelete(providerId) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID must be set in .env');
  }

  const res = await axios.delete(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${providerId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.data.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(res.data.errors)}`);
  }
}

// ─── Local (no external API) provider ────────────────────────────────────────

/**
 * Generate a local alias without calling any external API.
 * Useful when you have a catch-all forwarding rule set up externally.
 */
function localCreate() {
  const domain = process.env.EMAIL_DOMAIN;
  if (!domain) throw new Error('EMAIL_DOMAIN must be set in .env');

  const prefix = generatePrefix();
  return {
    aliasEmail: `${prefix}@${domain}`,
    providerId: null, // No external provider to reference
  };
}

// ─── Public interface ─────────────────────────────────────────────────────────

/**
 * Create a new email alias using the configured provider.
 *
 * @returns {{ aliasEmail: string, providerId: string|null }}
 */
export async function createEmailAlias() {
  switch (PROVIDER) {
    case 'simplelogin':
      return simpleLoginCreate();
    case 'cloudflare':
      return cloudflareCreate();
    case 'local':
      return localCreate();
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${PROVIDER}". Use "simplelogin", "cloudflare", or "local".`,
      );
  }
}

/**
 * Delete (or disable) an email alias using the configured provider.
 *
 * @param {string|null} providerId - The provider-specific ID stored in the DB
 * @param {string}      aliasEmail - Displayed in error messages
 */
export async function deleteEmailAlias(providerId, aliasEmail) {
  if (PROVIDER === 'local' || !providerId) {
    // Local mode: deletion is purely a database soft-delete — nothing to call
    return;
  }

  switch (PROVIDER) {
    case 'simplelogin':
      return simpleLoginDelete(providerId);
    case 'cloudflare':
      return cloudflareDelete(providerId);
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${PROVIDER}"`);
  }
}

/** Expose the active provider name so commands can show it in embeds */
export const activeProvider = PROVIDER;
