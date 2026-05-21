/**
 * Run this once to register all slash commands with Discord:
 *   node src/deploy-commands.js
 *
 * Re-run whenever you add, rename, or remove commands, or change DOMAIN_COMMANDS.
 *
 * - Set DISCORD_GUILD_ID for instant guild-scoped deployment (dev)
 * - Remove DISCORD_GUILD_ID for global deployment (takes up to 1 hour)
 */

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { getDomainCommands } from './utils/domains.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// ── Static commands ──────────────────────────────────────────────────────────
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if ('data' in mod) {
    commands.push(mod.data.toJSON());
    console.log(`Queued: /${mod.data.name}`);
  }
}

// ── Dynamic domain-specific commands ─────────────────────────────────────────
const domainCmds = getDomainCommands();
for (const { prefix, domain } of domainCmds) {
  const cmd = new SlashCommandBuilder()
    .setName(prefix)
    .setDescription(`Generate an email address @${domain}`)
    .toJSON();
  commands.push(cmd);
  console.log(`Queued: /${prefix} (@${domain})`);
}

if (commands.length === 0) {
  console.error('No commands to deploy. Check your commands/ directory and DOMAIN_COMMANDS env var.');
  process.exit(1);
}

// ── Deploy ────────────────────────────────────────────────────────────────────
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

console.log(`\nDeploying ${commands.length} command(s)...`);

try {
  let data;
  if (process.env.DISCORD_GUILD_ID) {
    data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
      { body: commands },
    );
    console.log(`✅ Deployed ${data.length} command(s) to guild ${process.env.DISCORD_GUILD_ID}`);
  } else {
    data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );
    console.log(`✅ Deployed ${data.length} command(s) globally`);
  }
} catch (err) {
  console.error('Deployment failed:', err.message);
  process.exit(1);
}
