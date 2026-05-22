/**
 * Multi-bot launcher — Memberk Emails Discord Bot
 *
 * Starts one Discord client per configured token. All bots share the same:
 *   - Slash commands (same handlers, same logic)
 *   - SQLite database (aliases are global across bots)
 *   - Webhook server (first bot's client handles DM delivery)
 *
 * Environment variable format:
 *   DISCORD_BOT_TOKEN_1=...   DISCORD_CLIENT_ID_1=...   (bot 1)
 *   DISCORD_BOT_TOKEN_2=...   DISCORD_CLIENT_ID_2=...   (bot 2)
 *   DISCORD_BOT_TOKEN_3=...   DISCORD_CLIENT_ID_3=...   (bot 3, etc.)
 *
 * Backward compatible: if TOKEN_1/TOKEN_2 aren't set, falls back to the
 * original DISCORD_BOT_TOKEN / DISCORD_CLIENT_ID single-bot variables.
 *
 * Optional per-bot variables:
 *   DISCORD_GUILD_ID_1=...    — guild-scoped command registration for bot 1
 *   DISCORD_GUILD_ID_2=...    — guild-scoped command registration for bot 2
 *   (falls back to DISCORD_GUILD_ID if the numbered version isn't set)
 *
 * AUTO_DEPLOY_COMMANDS=true   — register slash commands for ALL bots at startup
 */

import {
  Client,
  GatewayIntentBits,
  Collection,
  SlashCommandBuilder,
  REST,
  Routes,
} from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { logger } from './utils/logger.js';
import { initDatabase } from './utils/database.js';
import { getDomainCommands } from './utils/domains.js';
import { handleGenerate } from './utils/aliasGenerator.js';
import { startWebhookServer } from './server.js';
import { setClient, setBotStartTime } from './utils/clientStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Collect bot configurations from env vars ─────────────────────────────────

function collectBotConfigs() {
  const configs = [];

  // Short format: TOKEN_1, TOKEN_2, ...
  for (let i = 1; i <= 20; i++) {
    const token = process.env[`TOKEN_${i}`]?.trim();
    const clientId = process.env[`CLIENT_${i}`]?.trim();

    if (!token && !clientId) break; // Stop at the first gap
    if (!token || !clientId) {
      logger.warn(`Bot ${i}: TOKEN_${i} and CLIENT_${i} must both be set — skipping`);
      continue;
    }

    configs.push({
      index: i,
      token,
      clientId,
      guildId: process.env[`GUILD_${i}`]?.trim() || null,
    });
  }

  return configs;
}

const botConfigs = collectBotConfigs();

if (botConfigs.length === 0) {
  logger.error('No valid bot configuration found.');
  logger.error('Set TOKEN_1 + CLIENT_1 in your .env (and optionally TOKEN_2 + CLIENT_2, etc.).');
  process.exit(1);
}

logger.info(`Found ${botConfigs.length} bot configuration(s)`);

// ─── Initialise shared database ───────────────────────────────────────────────

try {
  const dbPath = initDatabase();
  logger.info(`SQLite database: ${dbPath}`);
} catch (err) {
  logger.error(`Database init failed: ${err.message}`);
  process.exit(1);
}

// ─── Load shared command definitions (done once, reused per bot) ──────────────

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

// Load all static command modules
const staticModules = [];
for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if ('data' in mod && 'execute' in mod) staticModules.push(mod);
}

// Build domain-specific command configs (shared across all bots)
const domainCmds = getDomainCommands();

// ─── Auto-register slash commands for all bots ────────────────────────────────
// Runs on every startup unless AUTO_DEPLOY_COMMANDS=false is explicitly set.
// This ensures commands (including domain prefix commands) are always up to date.

if (process.env.AUTO_DEPLOY_COMMANDS !== 'false') {
  logger.info(`Registering slash commands for ${botConfigs.length} bot(s)...`);
  for (const config of botConfigs) {
    try {
      await registerCommandsForBot(config);
    } catch (err) {
      logger.error(`Bot ${config.index}: command registration failed — ${err.message}`);
    }
  }
} else {
  logger.info('Command registration skipped (AUTO_DEPLOY_COMMANDS=false).');
}

// ─── Start each bot instance ──────────────────────────────────────────────────

const startedClients = [];

for (const config of botConfigs) {
  const client = await startBot(config);
  startedClients.push(client);
}

// The first bot's client is used for webhook DM delivery and log channel
setClient(startedClients[0]);

// ─── Start webhook server after first bot is ready ────────────────────────────
// (handled inside each bot's ready event — only the first bot starts it)

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: start a single bot instance
// ═══════════════════════════════════════════════════════════════════════════════

async function startBot(config) {
  const { index, token, clientId, guildId } = config;
  const tag = `[Bot ${index}]`;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });
  client.commands = new Collection();
  client._botIndex = index; // Store index for logging

  // ── Load static commands ───────────────────────────────────────────────────
  for (const mod of staticModules) {
    client.commands.set(mod.data.name, mod);
  }

  // ── Load domain-specific commands ─────────────────────────────────────────
  for (const { prefix, domain } of domainCmds) {
    if (client.commands.has(prefix)) continue;
    const capturedDomain = domain;
    client.commands.set(prefix, {
      data: new SlashCommandBuilder()
        .setName(prefix)
        .setDescription(`Generate an email address @${domain}`),
      execute: (interaction) => handleGenerate(interaction, capturedDomain),
    });
  }

  // ── Load events ────────────────────────────────────────────────────────────
  const eventsPath = join(__dirname, 'events');
  for (const file of readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
    const event = await import(pathToFileURL(join(eventsPath, file)).href);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  // ── Log in ─────────────────────────────────────────────────────────────────
  await client.login(token).catch((err) => {
    logger.error(`${tag} Login failed: ${err.message}`);
    // Don't exit — other bots should still start
  });

  // ── Post-ready: start webhook server on the FIRST bot only ────────────────
  if (index === startedClients.length + 1 || startedClients.length === 0) {
    client.once('ready', () => {
      setBotStartTime();

      if (process.env.ENABLE_WEBHOOK_SERVER === 'true') {
        startWebhookServer(client);
      } else {
        logger.info(`${tag} Webhook server disabled (ENABLE_WEBHOOK_SERVER=true to enable)`);
      }
    });
  }

  logger.info(`${tag} Starting (client ID: ${clientId}${guildId ? `, guild: ${guildId}` : ', global'})`);
  return client;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: register slash commands for one bot
// ═══════════════════════════════════════════════════════════════════════════════

async function registerCommandsForBot({ index, token, clientId, guildId }) {
  const tag = `[Bot ${index}]`;
  const commandsToRegister = staticModules.map((m) => m.data.toJSON());

  for (const { prefix, domain } of domainCmds) {
    commandsToRegister.push(
      new SlashCommandBuilder()
        .setName(prefix)
        .setDescription(`Generate an email address @${domain}`)
        .toJSON(),
    );
  }

  const rest = new REST().setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandsToRegister,
    });
    logger.info(`${tag} Registered ${commandsToRegister.length} commands to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commandsToRegister });
    logger.info(`${tag} Registered ${commandsToRegister.length} commands globally`);
  }
}
