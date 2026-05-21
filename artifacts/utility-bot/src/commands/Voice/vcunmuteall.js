import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vcunmuteall",
  description: "Remove server mute from all users in your voice channel",
  usage: "vcunmuteall",
  aliases: ["voiceunmuteall", "vuma"],
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

    const membersToUnmute = voiceChannel.members.filter(
      m => m.voice.serverMute && m.id !== message.author.id
    );

    if (membersToUnmute.size === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Users To Unmute`)
        .setDescription("There are no server muted users in your voice channel.");

      return message.reply({ embeds: [embed] });
    }

    try {
      let unmutedCount = 0;
      let failedCount = 0;

      for (const [, member] of membersToUnmute) {
        try {
          await member.voice.setMute(false, `Mass voice unmute by ${message.author.tag}`);
          unmutedCount++;
        } catch {
          failedCount++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Unmute All`)
        .setDescription(
          `**Channel:** ${voiceChannel.name}\n` +
          `**Unmuted:** ${unmutedCount} user(s)\n` +
          (failedCount > 0 ? `**Failed:** ${failedCount} user(s)` : "")
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Unmute All Failed`)
        .setDescription(`An error occurred: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
