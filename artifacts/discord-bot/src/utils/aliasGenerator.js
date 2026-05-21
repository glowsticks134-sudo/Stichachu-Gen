/**
 * Shared alias generation logic used by /gen and all domain-specific commands.
 *
 * Generates a random prefix (e.g. "swiftfox4721"), combines it with the
 * target domain, stores it in the database, and returns the full alias.
 */

import { EmbedBuilder, Colors } from 'discord.js';
import { createAlias, countActiveAliases, aliasExists } from './database.js';
import { checkCooldown, setCooldown } from './cooldowns.js';
import { logger } from './logger.js';

const COOLDOWN_SECS = 30;
const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '10', 10);
const MAX_RETRIES = 5; // Retry if a random prefix collides

const ADJECTIVES = [
  'swift', 'bright', 'calm', 'bold', 'keen', 'pure', 'vast', 'wise',
  'cool', 'dark', 'fair', 'free', 'glad', 'gold', 'good', 'gray',
  'hard', 'high', 'kind', 'long', 'loud', 'mild', 'neat', 'nice',
  'rare', 'real', 'rich', 'safe', 'slim', 'slow', 'soft', 'sure',
];
const NOUNS = [
  'fox', 'oak', 'ray', 'sky', 'sea', 'bay', 'ash', 'elm',
  'arc', 'dew', 'eve', 'fin', 'gem', 'gum', 'hay', 'ice',
  'ivy', 'jay', 'jet', 'key', 'koi', 'law', 'lea', 'log',
  'mew', 'orb', 'pea', 'pin', 'pod', 'roc', 'rod', 'sol',
];

function generatePrefix() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
}

/**
 * Core logic for generating an alias on a given domain.
 * Handles cooldowns, alias cap, deduplication, and DB insertion.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} domain - The domain to create the alias on (e.g. "larpers.cc")
 * @returns {Promise<void>}
 */
export async function handleGenerate(interaction, domain) {
  const userId = interaction.user.id;

  // ── 1. Cooldown check ──────────────────────────────────────────────────────
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

  // ── 2. Alias cap ───────────────────────────────────────────────────────────
  const count = countActiveAliases(userId);
  if (count >= MAX_ALIASES) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Limit reached')
          .setDescription(
            `You already have **${count}/${MAX_ALIASES}** active addresses.\n` +
            'Use `/listmails` to see them.',
          ),
      ],
      ephemeral: true,
    });
  }

  // Defer so we have time to process
  await interaction.deferReply({ ephemeral: true });
  setCooldown('gen', userId);

  // ── 3. Generate a unique prefix (retry on collision) ───────────────────────
  let aliasEmail = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const candidate = `${generatePrefix()}@${domain}`;
    if (!aliasExists(candidate)) {
      aliasEmail = candidate;
      break;
    }
  }

  if (!aliasEmail) {
    logger.error(`Could not generate unique alias on ${domain} after ${MAX_RETRIES} retries`);
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
  const record = createAlias({ discordUserId: userId, aliasEmail, domain });
  logger.alias('created', userId, aliasEmail);

  // ── 5. Success ─────────────────────────────────────────────────────────────
  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('✉️ Address Generated')
        .setDescription(`\`\`\`${aliasEmail}\`\`\``)
        .addFields(
          {
            name: 'Domain',
            value: `@${domain}`,
            inline: true,
          },
          {
            name: 'Your addresses',
            value: `${count + 1} / ${MAX_ALIASES}`,
            inline: true,
          },
        )
        .setFooter({
          text: 'Emails sent here will be delivered to your DMs • /listmails to see all',
        })
        .setTimestamp(),
    ],
  });
}
