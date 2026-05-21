/**
 * /delete — Remove one of the calling user's email aliases.
 *
 * Uses Discord's autocomplete API so your own aliases appear as suggestions
 * the moment you start typing — no need to remember the exact address.
 *
 * The alias is soft-deleted in the database. The bot will no longer deliver
 * emails sent to that address, but the catch-all route on your mail provider
 * will still receive them (they just get silently dropped on our end).
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { getAliasesByUser, deleteAlias, getAliasByEmail } from '../utils/database.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';
import { logger } from '../utils/logger.js';
import { sendLogMessage } from '../utils/logChannel.js';

const COOLDOWN_SECS = 10;

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

/**
 * Autocomplete handler — called by Discord as the user types in the alias field.
 * Returns up to 25 of the user's active aliases that match the current input.
 */
export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const userId = interaction.user.id;
  const aliases = getAliasesByUser(userId);

  const matches = aliases
    .filter((a) => a.alias_email.includes(focused))
    .slice(0, 25) // Discord max
    .map((a) => ({
      name: a.alias_email,
      value: a.alias_email,
    }));

  await interaction.respond(matches);
}

/** Slash command execute handler */
export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetAlias = interaction.options.getString('alias').toLowerCase().trim();

  // ── Cooldown ───────────────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('delete', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(`⏳ Please wait **${remainingSecs}s** before deleting another address.`),
      ],
      ephemeral: true,
    });
  }

  // ── Validate alias exists ──────────────────────────────────────────────────
  const record = getAliasByEmail(targetAlias);

  if (!record) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Not found')
          .setDescription(
            `\`${targetAlias}\` was not found.\n` +
            'Use `/listmails` to see your current addresses.',
          ),
      ],
      ephemeral: true,
    });
  }

  // ── Ownership check ────────────────────────────────────────────────────────
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

  setCooldown('delete', userId);

  // ── Soft-delete in database ────────────────────────────────────────────────
  deleteAlias(targetAlias, userId);
  logger.alias('deleted', userId, targetAlias);

  // ── Log channel notification ───────────────────────────────────────────────
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
