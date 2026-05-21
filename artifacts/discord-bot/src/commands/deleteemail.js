/**
 * /deleteemail — Delete (disable) one of the calling user's email aliases.
 *
 * Security:
 *  - Only the owner can delete their own alias (enforced by the DB query)
 *  - A 10-second cooldown prevents rapid-fire deletions
 *  - The alias is soft-deleted in the database and removed from the provider
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { getAliasesByUser, deleteAlias, getAliasByEmail } from '../utils/database.js';
import { deleteEmailAlias } from '../utils/emailService.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';
import { logger } from '../utils/logger.js';

const COOLDOWN_SECS = 10;

export const data = new SlashCommandBuilder()
  .setName('deleteemail')
  .setDescription('Delete one of your email aliases')
  .addStringOption((option) =>
    option
      .setName('alias')
      .setDescription('The full alias email to delete (e.g. swiftfox4721@yourdomain.com)')
      .setRequired(true),
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetAlias = interaction.options.getString('alias').toLowerCase().trim();

  // ── Cooldown ───────────────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('deleteemail', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⏳ Slow down!')
          .setDescription(`Please wait **${remainingSecs}s** before deleting another alias.`),
      ],
      ephemeral: true,
    });
  }

  // ── Validate the alias belongs to this user ────────────────────────────────
  const record = getAliasByEmail(targetAlias);

  if (!record) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Alias not found')
          .setDescription(
            `\`${targetAlias}\` was not found in the system.\n` +
            'Run `/myemails` to see your current aliases.',
          ),
      ],
      ephemeral: true,
    });
  }

  // Ownership check — prevent users from deleting each other's aliases
  if (record.discord_user_id !== userId) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Permission denied')
          .setDescription("You can only delete aliases that belong to you."),
      ],
      ephemeral: true,
    });
  }

  if (record.status === 'deleted') {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⚠️ Already deleted')
          .setDescription(`\`${targetAlias}\` has already been deleted.`),
      ],
      ephemeral: true,
    });
  }

  // Defer because the provider API call may take a moment
  await interaction.deferReply({ ephemeral: true });
  setCooldown('deleteemail', userId);

  // ── Call provider to remove the alias ─────────────────────────────────────
  try {
    await deleteEmailAlias(record.provider_id, targetAlias);
  } catch (err) {
    logger.error(`Provider delete error for ${targetAlias}: ${err.message}`);
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Provider error')
          .setDescription(
            'The email provider returned an error while deleting the alias.\n' +
            `\`${err.message}\`\n\n` +
            'The alias has NOT been removed from the database.',
          ),
      ],
    });
  }

  // ── Soft-delete in the database ────────────────────────────────────────────
  deleteAlias(targetAlias, userId);
  logger.alias('deleted', userId, targetAlias);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('🗑️ Alias deleted')
        .setDescription(`\`${targetAlias}\` has been successfully removed.`)
        .addFields({
          name: '📝 Note',
          value:
            'Emails sent to this address will no longer be forwarded. ' +
            'This action cannot be undone.',
        })
        .setFooter({ text: 'Only you can see this message' })
        .setTimestamp(),
    ],
  });
}
