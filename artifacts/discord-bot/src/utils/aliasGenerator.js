/**
 * Shared alias generation logic used by /gen and all domain-specific commands.
 *
 * Improvements over the original:
 *  - Near-limit warning when the user has used ≥80% of their quota
 *  - Log channel notification on every creation
 *  - Larger word lists for better randomness
 */

import { EmbedBuilder, Colors } from 'discord.js';
import { createAlias, countActiveAliases, aliasExists } from './database.js';
import { checkCooldown, setCooldown } from './cooldowns.js';
import { logger } from './logger.js';
import { sendLogMessage } from './logChannel.js';

const COOLDOWN_SECS = 30;
const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '10', 10);
const MAX_RETRIES = 8;

// Larger word lists → more unique combinations, lower collision chance
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

/** Returns a colour based on how full the user's quota is. */
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
 * Core alias generation handler — used by /gen and all domain-specific commands.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} domain
 */
export async function handleGenerate(interaction, domain) {
  const userId = interaction.user.id;

  // ── 1. Cooldown ────────────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('gen', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⏳ Slow down!')
          .setDescription(`You can generate another address in **${remainingSecs}s**.`),
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
  setCooldown('gen', userId);

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

  // ── 6. Build success reply ─────────────────────────────────────────────────
  const newCount = count + 1;
  const color = quotaColor(newCount, MAX_ALIASES);

  // Near-limit warning (at 80% capacity)
  const nearLimitNote =
    newCount / MAX_ALIASES >= 0.8
      ? `\n⚠️ You're at **${newCount}/${MAX_ALIASES}** — running low! Use \`/delete\` to free up slots.`
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
        .setFooter({
          text: 'Emails sent here arrive in your DMs • /listmails to see all',
        })
        .setTimestamp(),
    ],
  });
}
