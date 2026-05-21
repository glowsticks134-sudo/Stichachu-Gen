/**
 * Main entry point for the Discord Email Alias Bot.
 * Loads all commands and events, then logs in to Discord.
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { logger } from './utils/logger.js';
import { initDatabase } from './utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the Discord client with necessary intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Attach a commands collection to the client for easy access
client.commands = new Collection();

// ─── Load Commands ────────────────────────────────────────────────────────────
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`Loaded command: /${command.data.name}`);
  } else {
    logger.warn(`Skipping ${file} — missing "data" or "execute" export`);
  }
}

// ─── Load Events ─────────────────────────────────────────────────────────────
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = pathToFileURL(join(eventsPath, file)).href;
  const event = await import(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  logger.info(`Loaded event: ${event.name}`);
}

// ─── Initialise Database & Login ─────────────────────────────────────────────
try {
  initDatabase();
  logger.info('SQLite database initialised');
} catch (err) {
  logger.error(`Failed to initialise database: ${err.message}`);
  process.exit(1);
}

// Validate required environment variables before logging in
const requiredEnvVars = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  logger.error(`Failed to log in to Discord: ${err.message}`);
  process.exit(1);
});
