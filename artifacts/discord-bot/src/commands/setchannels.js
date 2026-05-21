/**
 * /setchannels — Restrict email generation to specific channels.
 *
 * Requires the "Manage Guild" permission — server admins only.
 *
 * Subcommands:
 *   /setchannels add    #channel  — add a channel to the allowlist
 *   /setchannels remove #channel  — remove a channel from the allowlist
 *   /setchannels list             — show the current allowlist
 *   /setchannels clear            — remove all restrictions (allow everywhere)
 *
 * Behaviour:
 *   - If the allowlist is EMPTY → all channels are allowed (default)
 *   - If the allowlist has entries → ONLY those channels can be used for /gen, /lgen, etc.
 *   - DMs are always allowed regardless of server settings
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  PermissionFlagsBits,
} from 'discord.js';
import {
  addAllowedChannel,
  removeAllowedChannel,
  clearAllowedChannels,
  getAllowedChannels,
} from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('setchannels')
  .setDescription('Restrict email generation to specific channels (admin only)')
  // Only users with Manage Guild permission can use this command
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  // This command only makes sense inside a server, not in DMs
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a channel to the generation allowlist')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The channel to allow')
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remove a channel from the allowlist')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The channel to remove')
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('Show which channels are currently allowed'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('clear')
      .setDescription('Remove all restrictions — allow email generation in every channel'),
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  switch (sub) {
    // ── add ──────────────────────────────────────────────────────────────────
    case 'add': {
      const channel = interaction.options.getChannel('channel');
      addAllowedChannel(guildId, channel.id);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('✅ Channel added')
            .setDescription(
              `<#${channel.id}> has been added to the generation allowlist.\n\n` +
              '**Effect:** Email generation commands will now only work in allowed channels.',
            )
            .setFooter({ text: 'Use /setchannels list to see all allowed channels' })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    // ── remove ───────────────────────────────────────────────────────────────
    case 'remove': {
      const channel = interaction.options.getChannel('channel');
      const removed = removeAllowedChannel(guildId, channel.id);

      if (!removed) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Orange)
              .setDescription(`<#${channel.id}> was not in the allowlist.`),
          ],
          ephemeral: true,
        });
      }

      const remaining = getAllowedChannels(guildId);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('✅ Channel removed')
            .setDescription(
              `<#${channel.id}> has been removed.\n\n` +
              (remaining.length === 0
                ? '**Allowlist is now empty — generation is allowed in all channels.**'
                : `**Remaining allowed channels:** ${remaining.map((id) => `<#${id}>`).join(', ')}`),
            )
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    // ── list ─────────────────────────────────────────────────────────────────
    case 'list': {
      const channelIds = getAllowedChannels(guildId);

      if (channelIds.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865f2)
              .setTitle('📋 Channel Allowlist')
              .setDescription(
                '**No restrictions set** — email generation is allowed in every channel.\n\n' +
                'Use `/setchannels add #channel` to restrict it to specific channels.',
              ),
          ],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📋 Allowed Channels (${channelIds.length})`)
            .setDescription(channelIds.map((id) => `<#${id}>`).join('\n'))
            .setFooter({
              text: 'Email generation commands only work in these channels • /setchannels clear to remove all restrictions',
            })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    // ── clear ─────────────────────────────────────────────────────────────────
    case 'clear': {
      const removed = clearAllowedChannels(guildId);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('✅ Restrictions cleared')
            .setDescription(
              removed > 0
                ? `Removed **${removed}** channel restriction${removed !== 1 ? 's' : ''}.\n\nEmail generation is now allowed in **all channels**.`
                : 'There were no channel restrictions to remove.',
            )
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }
  }
}
