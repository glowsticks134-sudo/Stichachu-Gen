/**
 * Main entry point for the Memberk Emails Discord bot.
 *
 * Startup sequence:
 *  1. Load static commands from commands/ directory
 *  2. Dynamically build domain-specific commands from DOMAIN_COMMANDS config
 *  3. Load events
 *  4. Initialise SQLite database
 *  5. Log in to Discord
 *  6. Start the webhook HTTP server (for email-to-DM delivery)
 */

import { Client, GatewayIntentBits, Collection, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { logger } from './utils/logger.js';
import { initDatabase } from './utils/database.js';
import { getDomainCommands } from './utils/domains.js';
import { handleGenerate } from './utils/aliasGenerator.js';
import { startWebhookServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// ─── Load Static Commands ──────────────────────────────────────────────────
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if ('data' in mod && 'execute' in mod) {
    client.commands.set(mod.data.name, mod);
    logger.info(`Loaded command: /${mod.data.name}`);
  }
}

// ─── Load Domain-Specific Commands Dynamically ────────────────────────────
// Each entry in DOMAIN_COMMANDS (e.g. "lgen:larpers.cc") becomes a slash
// command that generates an alias on that specific domain.
const domainCmds = getDomainCommands();

for (const { prefix, domain } of domainCmds) {
  // Skip if a static command already has this name
  if (client.commands.has(prefix)) {
    logger.warn(`Domain command "/${prefix}" conflicts with a static command — skipping`);
    continue;
  }

  // Capture domain in a closure for the execute function
  const capturedDomain = domain;

  const dynamicCommand = {
    data: new SlashCommandBuilder()
      .setName(prefix)
      .setDescription(`Generate an email address @${domain}`),
    execute: (interaction) => handleGenerate(interaction, capturedDomain),
  };

  client.commands.set(prefix, dynamicCommand);
  logger.info(`Loaded domain command: /${prefix} → @${domain}`);
}

// ─── Load Events ──────────────────────────────────────────────────────────
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = await import(pathToFileURL(join(eventsPath, file)).href);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  logger.info(`Loaded event: ${event.name}`);
}

// ─── Initialise Database ──────────────────────────────────────────────────
try {
  initDatabase();
  logger.info('SQLite database initialised');
} catch (err) {
  logger.error(`Database init failed: ${err.message}`);
  process.exit(1);
}

// ─── Validate Required Env Vars ──────────────────────────────────────────
for (const key of ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID']) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ─── Log In ───────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  logger.error(`Login failed: ${err.message}`);
  process.exit(1);
});

// ─── Start Webhook Server After Login ─────────────────────────────────────
// We wait for the "ready" event so the client is available for DMs
client.once('ready', () => {
  if (process.env.ENABLE_WEBHOOK_SERVER === 'true') {
    startWebhookServer(client);
  } else {
    logger.info('Webhook server disabled (set ENABLE_WEBHOOK_SERVER=true to enable)');
  }
});
