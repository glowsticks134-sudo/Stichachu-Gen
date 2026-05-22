/**
 * /deleteall — Bulk-delete every active email alias owned by the calling user.
 * Requires a button confirmation so accidental triggers are prevented.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAliasesByUser, deleteAlias } from '../utils/database.js';
import { deleteEmailAlias } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { sendLogMessage } from '../utils/logChannel.js';

export const data = new SlashCommandBuilder()
  .setName('deleteall')
  .setDescription('Delete all your email addresses at once');

export async function execute(interaction) {
  const userId = interaction.user.id;
  const aliases = getAliasesByUser(userId);

  if (aliases.length === 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription('You have no active addresses to delete.')
          .setFooter({ text: 'Only you can see this' }),
      ],
      ephemeral: true,
    });
  }

  const preview = aliases
    .map((a) => `\`${a.alias_email}\``)
    .join('\n')
    .slice(0, 1024);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_deleteall')
      .setLabel(`Delete all ${aliases.length} address${aliases.length === 1 ? '' : 'es'}`)
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
    new ButtonBuilder()
      .setCustomId('cancel_deleteall')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('⚠️ Delete All Addresses?')
        .setDescription(
          `You are about to permanently delete **${aliases.length}** address${aliases.length === 1 ? '' : 'es'}. This cannot be undone.`,
        )
        .addFields({ name: 'Addresses', value: preview })
        .setFooter({ text: 'This confirmation expires in 30 seconds · Only you can see this' }),
    ],
    components: [row],
    ephemeral: true,
  });

  const reply = await interaction.fetchReply();

  try {
    const btn = await reply.awaitMessageComponent({
      filter: (i) => i.user.id === userId,
      time: 30_000,
    });

    if (btn.customId === 'cancel_deleteall') {
      return btn.update({
        embeds: [
          new EmbedBuilder().setColor(Colors.Grey).setDescription('Cancelled. No addresses were deleted.'),
        ],
        components: [],
      });
    }

    // Soft-delete from DB + remove from provider
    let deleted = 0;
    for (const alias of aliases) {
      deleteAlias(alias.alias_email, userId);
      try {
        await deleteEmailAlias(alias.provider_id, alias.alias_email);
      } catch {
        // Provider errors are non-fatal
      }
      deleted++;
    }

    logger.alias('deleted_all', userId, `${deleted} addresses`);

    await sendLogMessage({
      color: Colors.Red,
      title: '🗑️ All Aliases Deleted',
      fields: [
        { name: 'Count', value: `${deleted}`, inline: true },
        { name: 'User', value: `<@${userId}>`, inline: true },
      ],
    });

    return btn.update({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('✅ All Addresses Deleted')
          .setDescription(`Successfully deleted **${deleted}** address${deleted === 1 ? '' : 'es'}.`)
          .addFields({
            name: '📝 Note',
            value: 'Emails sent to these addresses will no longer be delivered.',
          })
          .setFooter({ text: 'Only you can see this' })
          .setTimestamp(),
      ],
      components: [],
    });
  } catch {
    // Timed out — remove buttons
    interaction.editReply({ components: [] }).catch(() => {});
  }
}
