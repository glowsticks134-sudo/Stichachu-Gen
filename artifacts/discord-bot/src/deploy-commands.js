/**
 * Manual slash command registration script.
 * Run once after changing commands or DOMAIN_COMMANDS:
 *   node src/deploy-commands.js
 *
 * Registers commands for ALL configured bots (TOKEN_1, TOKEN_2, ...).
 * Uses per-bot DISCORD_GUILD_ID_N for instant guild registration, or
 * falls back to DISCORD_GUILD_ID, or deploys globally if neither is set.
 */

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { getDomainCommands } from './utils/domains.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Build command list ───────────────────────────────────────────────────────

const commands = [];

const commandsPath = join(__dirname, 'commands');
for (const file of readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if ('data' in mod) {
    commands.push(mod.data.toJSON());
    console.log(`  Queued: /${mod.data.name}`);
  }
}

for (const { prefix, domain } of getDomainCommands()) {
  commands.push(
    new SlashCommandBuilder()
      .setName(prefix)
      .setDescription(`Generate an email address @${domain}`)
      .toJSON(),
  );
  console.log(`  Queued: /${prefix} (@${domain})`);
}

console.log(`\nTotal commands: ${commands.length}\n`);

// ─── Collect bot configs ──────────────────────────────────────────────────────

function collectBotConfigs() {
  const configs = [];

  for (let i = 1; i <= 20; i++) {
    const token = process.env[`DISCORD_BOT_TOKEN_${i}`]?.trim();
    const clientId = process.env[`DISCORD_CLIENT_ID_${i}`]?.trim();
    if (!token && !clientId) break;
    if (!token || !clientId) { console.warn(`Bot ${i}: skipping — TOKEN or CLIENT_ID missing`); continue; }
    configs.push({
      index: i,
      token,
      clientId,
      guildId: process.env[`DISCORD_GUILD_ID_${i}`]?.trim() || process.env.DISCORD_GUILD_ID?.trim() || null,
    });
  }

  // Fallback to legacy single-bot variables
  if (configs.length === 0 && process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CLIENT_ID) {
    configs.push({
      index: 1,
      token: process.env.DISCORD_BOT_TOKEN.trim(),
      clientId: process.env.DISCORD_CLIENT_ID.trim(),
      guildId: process.env.DISCORD_GUILD_ID?.trim() || null,
    });
  }

  return configs;
}

const botConfigs = collectBotConfigs();

if (botConfigs.length === 0) {
  console.error('No bot configurations found. Set DISCORD_BOT_TOKEN_1 + DISCORD_CLIENT_ID_1.');
  process.exit(1);
}

// ─── Register for each bot ────────────────────────────────────────────────────

for (const { index, token, clientId, guildId } of botConfigs) {
  const rest = new REST().setToken(token);
  console.log(`Deploying to Bot ${index} (${guildId ? `guild ${guildId}` : 'global'})...`);

  try {
    let data;
    if (guildId) {
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    } else {
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    }
    console.log(`✅ Bot ${index}: deployed ${data.length} commands\n`);
  } catch (err) {
    console.error(`❌ Bot ${index}: failed — ${err.message}\n`);
  }
}
