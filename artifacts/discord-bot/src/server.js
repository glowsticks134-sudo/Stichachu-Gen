/**
 * Webhook HTTP server for receiving inbound emails and delivering them via Discord DM.
 *
 * PORT priority (Railway-compatible):
 *   1. PORT env var  — Railway injects this automatically for web services
 *   2. WEBHOOK_PORT  — explicit override for local dev
 *   3. 3001          — fallback default
 *
 * Endpoints (all POST):
 *   /webhook/mailgun    — Mailgun inbound routing (multipart/form-data)
 *   /webhook/cloudflare — Cloudflare Email Workers (JSON)
 *   /webhook/email      — Generic JSON: { to, from, subject, text }
 *
 * Security:
 *   Set WEBHOOK_SECRET and send it in the X-Webhook-Secret header from your
 *   mail provider. Requests without the matching header are rejected with 401.
 */

import express from 'express';
import multer from 'multer';
import { getAliasByEmail } from './utils/database.js';
import { logger } from './utils/logger.js';

const upload = multer();

/**
 * Start the webhook server.
 * @param {import('discord.js').Client} client
 * @returns {import('http').Server}
 */
export function startWebhookServer(client) {
  const app = express();

  // PORT is injected by Railway automatically; fall back to WEBHOOK_PORT or 3001
  const port = parseInt(process.env.PORT ?? process.env.WEBHOOK_PORT ?? '3001', 10);
  const secret = process.env.WEBHOOK_SECRET?.trim() || null;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Auth middleware ─────────────────────────────────────────────────────────
  app.use((req, res, next) => {
    if (req.path === '/health') return next();

    if (secret && req.headers['x-webhook-secret'] !== secret) {
      logger.warn(`Rejected webhook from ${req.ip} — bad or missing secret`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // ── Health check (Railway uses this to verify the service is up) ────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // ── Generic JSON endpoint ───────────────────────────────────────────────────
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

  // ── Mailgun inbound (multipart/form-data) ───────────────────────────────────
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

  // ── Cloudflare Email Workers (JSON) ─────────────────────────────────────────
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
    logger.info(`Health check: http://localhost:${port}/health`);
  });

  return server;
}

/**
 * Look up the alias owner and DM them the email content.
 */
async function deliverEmail(client, { to, from, subject, text }) {
  const aliasEmail = to.toLowerCase().trim();
  const record = getAliasByEmail(aliasEmail);

  if (!record) {
    logger.warn(`Email received for unknown alias: ${aliasEmail}`);
    return;
  }
  if (record.status !== 'active') {
    logger.warn(`Email received for inactive alias: ${aliasEmail}`);
    return;
  }

  let user;
  try {
    user = await client.users.fetch(record.discord_user_id);
  } catch (err) {
    logger.error(`Cannot fetch Discord user ${record.discord_user_id}: ${err.message}`);
    return;
  }

  const dmLines = [
    `**📧 New email to** \`${aliasEmail}\``,
    '',
    `**From:** ${from ?? 'Unknown'}`,
    `**Subject:** ${subject ?? '(no subject)'}`,
    '',
    '**Message:**',
    (text ?? '(no body)').slice(0, 1800),
  ];

  try {
    await user.send(dmLines.join('\n'));
    logger.alias('delivered', record.discord_user_id, aliasEmail);
  } catch (err) {
    logger.warn(`Cannot DM user ${record.discord_user_id} (DMs may be off): ${err.message}`);
  }
}
