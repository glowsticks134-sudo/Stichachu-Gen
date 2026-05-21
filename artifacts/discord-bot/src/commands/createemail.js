/**
 * /createemail — Generate a new unique email alias for the calling user.
 *
 * Anti-spam protections:
 *  - 30-second cooldown per user
 *  - Hard cap of MAX_ALIASES_PER_USER active aliases per user
 *  - Duplicate-alias check before inserting into the database
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';
import { createAlias, countActiveAliases, aliasExists } from '../utils/database.js';
import { createEmailAlias, activeProvider } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

// Cooldown in seconds for this command
const COOLDOWN_SECS = 30;

// Maximum number of active aliases any single user may hold
const MAX_ALIASES_PER_USER = parseInt(process.env.MAX_ALIASES_PER_USER ?? '5', 10);

export const data = new SlashCommandBuilder()
  .setName('createemail')
  .setDescription('Generate a new unique email alias for your account');

export async function execute(interaction) {
  const userId = interaction.user.id;

  // ── 1. Cooldown check ──────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('createemail', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⏳ Slow down!')
          .setDescription(
            `You can create another alias in **${remainingSecs}s**.\n` +
            'This limit helps prevent abuse.',
          ),
      ],
      ephemeral: true,
    });
  }

  // ── 2. Alias cap check ─────────────────────────────────────────────────────
  const currentCount = countActiveAliases(userId);
  if (currentCount >= MAX_ALIASES_PER_USER) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Alias limit reached')
          .setDescription(
            `You already have **${currentCount}/${MAX_ALIASES_PER_USER}** active aliases.\n` +
            'Delete one with `/deleteemail` before creating a new one.',
          ),
      ],
      ephemeral: true,
    });
  }

  // Defer the reply because the API call might take a moment
  await interaction.deferReply({ ephemeral: true });

  // ── 3. Apply cooldown immediately so rapid retries are blocked ─────────────
  setCooldown('createemail', userId);

  // ── 4. Call the email provider ─────────────────────────────────────────────
  let aliasEmail, providerId;
  try {
    ({ aliasEmail, providerId } = await createEmailAlias());
  } catch (err) {
    logger.error(`Email provider error for user ${userId}: ${err.message}`);
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Provider error')
          .setDescription(
            'The email provider returned an error. Please try again later.\n' +
            `\`${err.message}\``,
          ),
      ],
    });
  }

  // ── 5. Duplicate guard (edge-case: provider returned a colliding alias) ────
  if (aliasExists(aliasEmail)) {
    logger.warn(`Provider returned duplicate alias ${aliasEmail} — retrying is safe`);
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⚠️ Alias collision')
          .setDescription('A rare collision occurred. Please run `/createemail` again.'),
      ],
    });
  }

  // ── 6. Store in database ───────────────────────────────────────────────────
  const record = createAlias({ discordUserId: userId, aliasEmail, providerId });
  logger.alias('created', userId, aliasEmail);

  // ── 7. Success reply ───────────────────────────────────────────────────────
  const providerLabel = {
    simplelogin: 'SimpleLogin',
    cloudflare: 'Cloudflare Email Routing',
    local: 'Local (catch-all)',
  }[activeProvider] ?? activeProvider;

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Email alias created')
        .addFields(
          { name: '📧 Alias', value: `\`${aliasEmail}\``, inline: false },
          { name: '🔢 Active aliases', value: `${currentCount + 1} / ${MAX_ALIASES_PER_USER}`, inline: true },
          { name: '⚙️ Provider', value: providerLabel, inline: true },
        )
        .setFooter({ text: 'Only you can see this message' })
        .setTimestamp(new Date(record.created_at)),
    ],
  });
}
