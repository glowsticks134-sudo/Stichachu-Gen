import { EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vcmoveall",
  description: "Move all users from your voice channel to another channel",
  usage: "vcmoveall <#channel>",
  aliases: ["voicemoveall", "vmall", "vcmove"],
  category: "Voice",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.MoveMembers],
  permissions: [PermissionFlagsBits.MoveMembers],

  async execute({ client, message, args }) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not Connected`)
        .setDescription("You must be connected to a voice channel first.");

      return message.reply({ embeds: [embed] });
    }

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please mention or provide the ID of a voice channel to move users to.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    const targetChannelId = args[0].replace(/[<#>]/g, "");
    const targetChannel = message.guild.channels.cache.get(targetChannelId);

    if (!targetChannel || (targetChannel.type !== ChannelType.GuildVoice && targetChannel.type !== ChannelType.GuildStageVoice)) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Channel`)
        .setDescription("Please provide a valid voice channel.");

      return message.reply({ embeds: [embed] });
    }

    if (targetChannel.id === voiceChannel.id) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Same Channel`)
        .setDescription("Target channel must be different from your current channel.");

      return message.reply({ embeds: [embed] });
    }

    const membersToMove = voiceChannel.members.filter(m => m.id !== message.author.id);

    if (membersToMove.size === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Users To Move`)
        .setDescription("There are no other users in your voice channel to move.");

      return message.reply({ embeds: [embed] });
    }

    try {
      let movedCount = 0;
      let failedCount = 0;

      for (const [, member] of membersToMove) {
        try {
          await member.voice.setChannel(targetChannel, `Mass move by ${message.author.tag}`);
          movedCount++;
        } catch {
          failedCount++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Move All`)
        .setDescription(
          `**From:** ${voiceChannel.name}\n` +
          `**To:** ${targetChannel.name}\n` +
          `**Moved:** ${movedCount} user(s)\n` +
          (failedCount > 0 ? `**Failed:** ${failedCount} user(s)` : "")
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Move All Failed`)
        .setDescription(`An error occurred: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
