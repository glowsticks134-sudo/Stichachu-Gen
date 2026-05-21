/**
 * Shared alias generation logic used by /gen and all domain-specific commands.
 *
 * Changes:
 *  - No cooldowns (removed by user request)
 *  - Default limit raised to 20
 *  - Channel allowlist check before generating
 */

import { EmbedBuilder, Colors } from 'discord.js';
import { createAlias, countActiveAliases, aliasExists, isChannelAllowed } from './database.js';
import { logger } from './logger.js';
import { sendLogMessage } from './logChannel.js';

const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '20', 10);
const MAX_RETRIES = 8;

const ADJECTIVES = [
  'swift', 'bright', 'calm', 'bold', 'keen', 'pure', 'vast', 'wise',
  'cool', 'dark', 'fair', 'free', 'glad', 'gold', 'good', 'gray',
  'hard', 'high', 'kind', 'long', 'loud', 'mild', 'neat', 'nice',
  'rare', 'real', 'rich', 'safe', 'slim', 'slow', 'soft', 'sure',
  'warm', 'wild', 'blue', 'jade', 'rose', 'sage', 'teal', 'amber',
  'aqua', 'azure', 'bronze', 'cedar', 'coral', 'crisp', 'dusk',
  'ember', 'fern', 'frost', 'gloom', 'haze', 'lunar', 'mist',
];
const NOUNS = [
  'fox', 'oak', 'ray', 'sky', 'sea', 'bay', 'ash', 'elm',
  'arc', 'dew', 'eve', 'fin', 'gem', 'gum', 'hay', 'ice',
  'ivy', 'jay', 'jet', 'key', 'koi', 'law', 'lea', 'log',
  'mew', 'orb', 'pea', 'pin', 'pod', 'roc', 'rod', 'sol',
  'tern', 'tide', 'vale', 'wren', 'yew', 'zap', 'bloom',
  'brook', 'cliff', 'crest', 'dale', 'dell', 'dove', 'fawn',
  'fern', 'gale', 'glen', 'grove', 'hawk', 'heron', 'knoll',
];

function generatePrefix() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
}

function quotaColor(used, max) {
  const pct = used / max;
  if (pct >= 0.9) return Colors.Red;
  if (pct >= 0.7) return Colors.Yellow;
  return 0x5865f2;
}

/** Relative time string — "2 hours ago", "just now", etc. */
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Core alias generation handler.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} domain
 */
export async function handleGenerate(interaction, domain) {
  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  // ── 1. Channel allowlist check ─────────────────────────────────────────────
  // Only enforced inside a server (not in DMs)
  if (guildId && !isChannelAllowed(guildId, channelId)) {
    const { getAllowedChannels } = await import('./database.js');
    const channelIds = getAllowedChannels(guildId);
    const mentions = channelIds.map((id) => `<#${id}>`).join(', ');

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Wrong channel')
          .setDescription(
            `Email generation is restricted to specific channels in this server.\n\n` +
            `**Allowed:** ${mentions || 'None set'}`,
          ),
      ],
      ephemeral: true,
    });
  }

  // ── 2. Quota check ─────────────────────────────────────────────────────────
  const count = countActiveAliases(userId);
  if (count >= MAX_ALIASES) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Limit reached')
          .setDescription(
            `You have **${count}/${MAX_ALIASES}** active addresses — the maximum.\n` +
            'Use `/delete` to remove one before generating a new one.',
          ),
      ],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  // ── 3. Generate unique prefix ──────────────────────────────────────────────
  let aliasEmail = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const candidate = `${generatePrefix()}@${domain}`;
    if (!aliasExists(candidate)) {
      aliasEmail = candidate;
      break;
    }
  }

  if (!aliasEmail) {
    logger.error(`Could not generate unique alias on ${domain} after ${MAX_RETRIES} tries`);
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Generation failed')
          .setDescription('Could not generate a unique address. Please try again.'),
      ],
    });
  }

  // ── 4. Store in database ───────────────────────────────────────────────────
  createAlias({ discordUserId: userId, aliasEmail, domain });
  logger.alias('created', userId, aliasEmail);

  // ── 5. Log channel notification ────────────────────────────────────────────
  await sendLogMessage({
    color: Colors.Green,
    title: '✉️ Alias Created',
    fields: [
      { name: 'Address', value: `\`${aliasEmail}\``, inline: true },
      { name: 'User', value: `<@${userId}>`, inline: true },
      { name: 'Total (this user)', value: `${count + 1} / ${MAX_ALIASES}`, inline: true },
    ],
  });

  // ── 6. Success reply ───────────────────────────────────────────────────────
  const newCount = count + 1;
  const color = quotaColor(newCount, MAX_ALIASES);
  const nearLimitNote =
    newCount / MAX_ALIASES >= 0.8
      ? `\n⚠️ You're at **${newCount}/${MAX_ALIASES}** — running low. Use \`/delete\` to free up slots.`
      : '';

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(color)
        .setTitle('✉️ Address Generated')
        .setDescription(`\`\`\`${aliasEmail}\`\`\`${nearLimitNote}`)
        .addFields(
          { name: 'Domain', value: `@${domain}`, inline: true },
          { name: 'Your addresses', value: `${newCount} / ${MAX_ALIASES}`, inline: true },
        )
        .setFooter({ text: 'Emails sent here arrive in your DMs • /listmails to see all' })
        .setTimestamp(),
    ],
  });
}
