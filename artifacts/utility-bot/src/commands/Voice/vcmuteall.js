import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vcmuteall",
  description: "Server mute all users in your voice channel",
  usage: "vcmuteall",
  aliases: ["voicemuteall", "vma"],
  category: "Voice",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.MuteMembers],
  permissions: [PermissionFlagsBits.MuteMembers],

  async execute({ client, message, args }) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not Connected`)
        .setDescription("You must be connected to a voice channel first.");

      return message.reply({ embeds: [embed] });
    }

    const membersToMute = voiceChannel.members.filter(
      m => !m.voice.serverMute && m.id !== message.author.id && !m.user.bot
    );

    if (membersToMute.size === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Users To Mute`)
        .setDescription("There are no users to mute in your voice channel.");

      return message.reply({ embeds: [embed] });
    }

    try {
      let mutedCount = 0;
      let failedCount = 0;

      for (const [, member] of membersToMute) {
        try {
          await member.voice.setMute(true, `Mass voice mute by ${message.author.tag}`);
          mutedCount++;
        } catch {
          failedCount++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Mute All`)
        .setDescription(
          `**Channel:** ${voiceChannel.name}\n` +
          `**Muted:** ${mutedCount} user(s)\n` +
          (failedCount > 0 ? `**Failed:** ${failedCount} user(s)` : "")
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Mute All Failed`)
        .setDescription(`An error occurred: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
