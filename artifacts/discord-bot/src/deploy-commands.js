/**
 * Run this script once to register slash commands with Discord.
 * Usage: node src/deploy-commands.js
 *
 * You only need to re-run this when you add or change command definitions.
 * Global deployment can take up to 1 hour to propagate; set DISCORD_GUILD_ID
 * for instant guild-scoped deployment during development.
 */

import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);
  if ('data' in command) {
    commands.push(command.data.toJSON());
    console.log(`Queued command: /${command.data.name}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

try {
  console.log(`Deploying ${commands.length} slash command(s)...`);

  let data;
  if (process.env.DISCORD_GUILD_ID) {
    // Guild-scoped: instant, ideal for development
    data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
      { body: commands },
    );
    console.log(`✅ Deployed ${data.length} command(s) to guild ${process.env.DISCORD_GUILD_ID}`);
  } else {
    // Global: takes up to 1 hour to propagate
    data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );
    console.log(`✅ Deployed ${data.length} command(s) globally`);
  }
} catch (err) {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
}
