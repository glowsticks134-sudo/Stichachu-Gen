/**
 * Webhook HTTP server for receiving inbound emails and delivering them via Discord DM.
 *
 * When someone sends an email to one of the bot's aliases, your mail provider
 * (Mailgun, Cloudflare Email Workers, or any custom service) should POST to:
 *
 *   POST /webhook/mailgun  — Mailgun inbound routing format
 *   POST /webhook/email    — Generic JSON format (from any provider)
 *
 * Generic JSON format:
 *   {
 *     "to":      "alias@domain.com",
 *     "from":    "sender@example.com",
 *     "subject": "Hello!",
 *     "text":    "Email body here"
 *   }
 *
 * The server looks up the alias in SQLite, finds the owner's Discord ID,
 * and sends them a DM with the email content.
 *
 * Set WEBHOOK_PORT in .env (default: 3001).
 * Set WEBHOOK_SECRET in .env to require a secret header for security.
 */

import express from 'express';
import multer from 'multer';
import { getAliasByEmail } from './utils/database.js';
import { logger } from './utils/logger.js';

// multer handles multipart/form-data (Mailgun's inbound format)
const upload = multer();

/**
 * Start the webhook server and wire up the Discord client for DM delivery.
 *
 * @param {import('discord.js').Client} client — the logged-in Discord client
 * @returns {import('http').Server}
 */
export function startWebhookServer(client) {
  const app = express();
  const port = parseInt(process.env.WEBHOOK_PORT ?? '3001', 10);
  const secret = process.env.WEBHOOK_SECRET ?? null;

  // Parse JSON bodies (for the generic endpoint)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Security middleware ──────────────────────────────────────────────────
  app.use((req, res, next) => {
    // Skip secret check for the health endpoint
    if (req.path === '/health') return next();

    // If a secret is configured, require it in the X-Webhook-Secret header
    if (secret && req.headers['x-webhook-secret'] !== secret) {
      logger.warn(`Rejected webhook request from ${req.ip} — invalid secret`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // ── Generic JSON email webhook ────────────────────────────────────────────
  app.post('/webhook/email', async (req, res) => {
    try {
      const { to, from, subject, text } = req.body ?? {};
      if (!to) return res.status(400).json({ error: 'Missing "to" field' });

      await deliverEmail(client, { to, from, subject, text });
      res.json({ ok: true });
    } catch (err) {
      logger.error(`Generic webhook error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Mailgun inbound webhook ───────────────────────────────────────────────
  // Mailgun sends multipart/form-data with fields: recipient, sender, subject, body-plain
  app.post('/webhook/mailgun', upload.none(), async (req, res) => {
    try {
      const to = req.body?.recipient ?? req.body?.To;
      const from = req.body?.sender ?? req.body?.From;
      const subject = req.body?.subject ?? req.body?.Subject;
      const text = req.body?.['body-plain'] ?? req.body?.['stripped-text'] ?? '';

      if (!to) return res.status(400).json({ error: 'Missing recipient' });

      await deliverEmail(client, { to, from, subject, text });
      res.json({ ok: true });
    } catch (err) {
      logger.error(`Mailgun webhook error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Cloudflare Email Workers webhook ─────────────────────────────────────
  // When using Cloudflare Email Workers, configure your worker to POST here
  // with JSON: { to, from, subject, text }
  app.post('/webhook/cloudflare', async (req, res) => {
    try {
      const { to, from, subject, text } = req.body ?? {};
      if (!to) return res.status(400).json({ error: 'Missing "to" field' });

      await deliverEmail(client, { to, from, subject, text });
      res.json({ ok: true });
    } catch (err) {
      logger.error(`Cloudflare webhook error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  const server = app.listen(port, () => {
    logger.info(`Webhook server listening on port ${port}`);
  });

  return server;
}

/**
 * Look up the alias owner in the database and send them a Discord DM.
 *
 * @param {import('discord.js').Client} client
 * @param {{ to: string, from?: string, subject?: string, text?: string }} email
 */
async function deliverEmail(client, { to, from, subject, text }) {
  const aliasEmail = to.toLowerCase().trim();
  const record = getAliasByEmail(aliasEmail);

  if (!record) {
    logger.warn(`Received email for unknown alias: ${aliasEmail}`);
    return; // Not our alias — silently ignore
  }

  if (record.status !== 'active') {
    logger.warn(`Received email for inactive alias: ${aliasEmail}`);
    return;
  }

  // Fetch the Discord user and DM them
  let user;
  try {
    user = await client.users.fetch(record.discord_user_id);
  } catch (err) {
    logger.error(`Could not fetch Discord user ${record.discord_user_id}: ${err.message}`);
    return;
  }

  // Build a nicely formatted DM
  const dmLines = [
    `**📧 New email to** \`${aliasEmail}\``,
    '',
    `**From:** ${from ?? 'Unknown'}`,
    `**Subject:** ${subject ?? '(no subject)'}`,
    '',
    '**Message:**',
    (text ?? '(no body)').slice(0, 1800), // Discord DM limit is ~2000 chars
  ];

  try {
    await user.send(dmLines.join('\n'));
    logger.alias('delivered', record.discord_user_id, aliasEmail);
  } catch (err) {
    // User might have DMs disabled — log and move on
    logger.warn(
      `Could not DM user ${record.discord_user_id} (DMs may be disabled): ${err.message}`,
    );
  }
}
