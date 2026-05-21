/**
 * Main entry point — Memberk Emails Discord bot.
 *
 * Startup sequence:
 *  1. Validate required environment variables
 *  2. Initialise SQLite database
 *  3. Auto-register slash commands (if AUTO_DEPLOY_COMMANDS=true)
 *  4. Load static commands from commands/ directory
 *  5. Build domain-specific commands from DOMAIN_COMMANDS config
 *  6. Load events
 *  7. Log in to Discord
 *  8. On ready: record start time, start webhook server (if enabled)
 *
 * Railway deployment:
 *   Set AUTO_DEPLOY_COMMANDS=true for the first deploy so slash commands
 *   register automatically. Set it back to false after — commands persist
 *   in Discord until you explicitly change them.
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

// ─── Validate required env vars before doing anything else ───────────────────
const REQUIRED = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID'];
for (const key of REQUIRED) {
  if (!process.env[key]?.trim()) {
    logger.error(`Missing required environment variable: ${key}`);
    logger.error('Add it to your Railway Variables tab or Replit Secrets panel.');
    process.exit(1);
  }
}

// ─── Initialise database ──────────────────────────────────────────────────────
try {
  const dbPath = initDatabase();
  logger.info(`SQLite database: ${dbPath}`);
} catch (err) {
  logger.error(`Database init failed: ${err.message}`);
  process.exit(1);
}

// ─── Auto-register slash commands (Railway first-deploy helper) ───────────────
if (process.env.AUTO_DEPLOY_COMMANDS === 'true') {
  logger.info('AUTO_DEPLOY_COMMANDS=true — registering slash commands now...');
  try {
    await registerCommands();
    logger.info('Slash commands registered successfully.');
  } catch (err) {
    // Non-fatal: log the error but continue starting the bot
    logger.error(`Slash command registration failed: ${err.message}`);
  }
}

// ─── Create Discord client ────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});
client.commands = new Collection();

// Make the client available to utility modules (log channel, etc.)
setClient(client);

// ─── Load static commands ─────────────────────────────────────────────────────
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if ('data' in mod && 'execute' in mod) {
    client.commands.set(mod.data.name, mod);
    logger.info(`Loaded command: /${mod.data.name}`);
  }
}

// ─── Build domain-specific commands from DOMAIN_COMMANDS ─────────────────────
const domainCmds = getDomainCommands();
for (const { prefix, domain } of domainCmds) {
  if (client.commands.has(prefix)) {
    logger.warn(`Domain command "/${prefix}" conflicts with a static command — skipping`);
    continue;
  }
  const capturedDomain = domain;
  client.commands.set(prefix, {
    data: new SlashCommandBuilder()
      .setName(prefix)
      .setDescription(`Generate an email address @${domain}`),
    execute: (interaction) => handleGenerate(interaction, capturedDomain),
  });
  logger.info(`Loaded domain command: /${prefix} → @${domain}`);
}

// ─── Load events ──────────────────────────────────────────────────────────────
const eventsPath = join(__dirname, 'events');
for (const file of readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = await import(pathToFileURL(join(eventsPath, file)).href);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  logger.info(`Loaded event: ${event.name}`);
}

// ─── Log in ───────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  logger.error(`Login failed: ${err.message}`);
  process.exit(1);
});

// ─── Post-ready setup ─────────────────────────────────────────────────────────
client.once('ready', () => {
  setBotStartTime();

  if (process.env.ENABLE_WEBHOOK_SERVER === 'true') {
    startWebhookServer(client);
  } else {
    logger.info('Webhook server disabled (set ENABLE_WEBHOOK_SERVER=true to enable)');
  }
});

// ─── Slash command registration helper ───────────────────────────────────────
/**
 * Collects all command definitions (static + domain-specific) and pushes them
 * to Discord via the REST API. Called at startup when AUTO_DEPLOY_COMMANDS=true.
 */
async function registerCommands() {
  const commandsToRegister = [];

  // Static commands
  const cmdFiles = readdirSync(join(__dirname, 'commands')).filter((f) => f.endsWith('.js'));
  for (const file of cmdFiles) {
    const mod = await import(pathToFileURL(join(join(__dirname, 'commands'), file)).href);
    if ('data' in mod) commandsToRegister.push(mod.data.toJSON());
  }

  // Domain-specific commands
  for (const { prefix, domain } of getDomainCommands()) {
    commandsToRegister.push(
      new SlashCommandBuilder()
        .setName(prefix)
        .setDescription(`Generate an email address @${domain}`)
        .toJSON(),
    );
  }

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

  if (process.env.DISCORD_GUILD_ID?.trim()) {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
      { body: commandsToRegister },
    );
    logger.info(
      `Registered ${commandsToRegister.length} commands to guild ${process.env.DISCORD_GUILD_ID}`,
    );
  } else {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commandsToRegister },
    );
    logger.info(`Registered ${commandsToRegister.length} commands globally`);
  }
}
