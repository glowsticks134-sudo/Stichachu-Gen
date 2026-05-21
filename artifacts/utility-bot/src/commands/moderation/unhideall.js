import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "unhideall",
  description: "Unhide all channels in the server",
  usage: "unhideall",
  aliases: ["unhidechannels", "showall"],
  category: "moderation",
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  permissions: [PermissionFlagsBits.ManageChannels],
  enabledSlash: true,
  slashData: { name: "unhideall", description: "Unhide all channels in this server" },

  async execute({ client, message, args }) {
    try {
      let count = 0;
      const channels = message.guild.channels.cache;

      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            ViewChannel: true,
          });
          count++;
        } catch (e) {
        }
      }

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("unhide")} All Channels Unhidden`)
        .setDescription(
          `**Channels Unhidden:** ${count}\n` +
          `**Moderator:** ${message.author.tag}`
        );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Unhide All Failed`)
        .setDescription(`Failed to unhide channels: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    let count = 0;
    for (const [, ch] of interaction.guild.channels.cache) {
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).then(() => count++).catch(() => {});
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unhide")} All Channels Unhidden`).setDescription(`**Channels Unhidden:** ${count}`)] });
  },
};
