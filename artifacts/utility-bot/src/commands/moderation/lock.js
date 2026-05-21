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
  name: "lock",
  description: "Lock a channel to prevent messages",
  usage: "lock [channel] [reason]",
  aliases: ["lockdown"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  permissions: [PermissionFlagsBits.ManageChannels],
  enabledSlash: true,
  slashData: {
    name: "lock",
    description: "Lock a channel to prevent messages",
    options: [
      { name: "channel", description: "The channel to lock", type: 7, required: false },
      { name: "reason", description: "Reason for locking", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.filter(a => !a.startsWith('<#')).join(" ") || "No reason provided";

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      });

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("lock")} Channel Locked`)
        .setDescription(
          `**Channel:** ${channel}\n` +
          `**Reason:** ${reason}\n` +
          `**Moderator:** ${message.author.tag}`
        );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Lock Failed`)
        .setDescription(`Failed to lock the channel: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    const reason = interaction.options.getString("reason") || "No reason provided";

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Support").setURL(config.links.supportServer).setStyle(ButtonStyle.Link));
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("lock")} Channel Locked`).setDescription(`**Channel:** ${channel}\n**Reason:** ${reason}`);
      return interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Lock Failed`).setDescription(`Failed: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
