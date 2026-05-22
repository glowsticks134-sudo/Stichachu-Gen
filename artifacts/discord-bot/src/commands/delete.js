/**
 * /delete — Remove one of the calling user's email aliases.
 *
 * Uses Discord's autocomplete API so aliases appear as suggestions while typing.
 * No cooldown.
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasesByUser, deleteAlias, getAliasByEmail } from '../utils/database.js';
import { deleteEmailAlias } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { sendLogMessage } from '../utils/logChannel.js';

export const data = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Delete one of your email addresses')
  .addStringOption((option) =>
    option
      .setName('alias')
      .setDescription('The address to delete (start typing to see your options)')
      .setRequired(true)
      .setAutocomplete(true),
  );

/** Autocomplete — returns user's active aliases matching the current input */
export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const aliases = getAliasesByUser(interaction.user.id);

  await interaction.respond(
    aliases
      .filter((a) => a.alias_email.includes(focused))
      .slice(0, 25)
      .map((a) => ({ name: a.alias_email, value: a.alias_email })),
  );
}

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetAlias = interaction.options.getString('alias').toLowerCase().trim();

  const record = getAliasByEmail(targetAlias);

  if (!record) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Not found')
          .setDescription(`\`${targetAlias}\` was not found.\nUse \`/listmails\` to see your addresses.`),
      ],
      ephemeral: true,
    });
  }

  if (record.discord_user_id !== userId) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Not your address')
          .setDescription('You can only delete addresses that belong to you.'),
      ],
      ephemeral: true,
    });
  }

  if (record.status === 'deleted') {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(`\`${targetAlias}\` has already been deleted.`),
      ],
      ephemeral: true,
    });
  }

  deleteAlias(targetAlias, userId);

  // Also remove from the email provider (SimpleLogin / Cloudflare) so emails
  // sent to this address actually stop being delivered.
  try {
    await deleteEmailAlias(record.provider_id, targetAlias);
  } catch (err) {
    logger.warn(`Provider deletion failed for ${targetAlias}: ${err.message}`);
    // Non-fatal — alias is already soft-deleted in the database.
  }

  logger.alias('deleted', userId, targetAlias);

  await sendLogMessage({
    color: Colors.Red,
    title: '🗑️ Alias Deleted',
    fields: [
      { name: 'Address', value: `\`${targetAlias}\``, inline: true },
      { name: 'User', value: `<@${userId}>`, inline: true },
    ],
  });

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Address Deleted')
        .setDescription(`\`${targetAlias}\` has been removed.`)
        .addFields({
          name: '📝 Note',
          value: 'Emails sent to this address will no longer be delivered to your DMs.',
        })
        .setFooter({ text: 'Only you can see this' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
