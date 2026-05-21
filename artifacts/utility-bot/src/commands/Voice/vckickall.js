import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vckickall",
  description: "Disconnect all users from your voice channel",
  usage: "vckickall",
  aliases: ["voicekickall", "vka", "vcdisconnectall"],
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

    const membersToKick = voiceChannel.members.filter(
      m => m.id !== message.author.id && !m.user.bot
    );

    if (membersToKick.size === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Users To Kick`)
        .setDescription("There are no users to kick from your voice channel.");

      return message.reply({ embeds: [embed] });
    }

    try {
      let kickedCount = 0;
      let failedCount = 0;

      for (const [, member] of membersToKick) {
        try {
          await member.voice.disconnect(`Mass voice kick by ${message.author.tag}`);
          kickedCount++;
        } catch {
          failedCount++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Kick All`)
        .setDescription(
          `**Channel:** ${voiceChannel.name}\n` +
          `**Disconnected:** ${kickedCount} user(s)\n` +
          (failedCount > 0 ? `**Failed:** ${failedCount} user(s)` : "")
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Kick All Failed`)
        .setDescription(`An error occurred: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
