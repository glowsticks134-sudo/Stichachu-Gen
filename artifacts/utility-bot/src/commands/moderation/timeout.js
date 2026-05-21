import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

const parseDuration = (str) => {
  const match = str?.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
};

export default {
  name: "timeout",
  description: "Timeout a member (10s/30m/1h/7d format)",
  usage: "timeout <@user> <duration> [reason]",
  aliases: ["mute", "to"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  permissions: [PermissionFlagsBits.ModerateMembers],
  enabledSlash: true,
  slashData: {
    name: "timeout",
    description: "Timeout a member",
    options: [
      { name: "user", description: "The member to timeout", type: 6, required: true },
      { name: "duration", description: "Duration (10s, 30m, 1h, 7d)", type: 3, required: true },
      { name: "reason", description: "Reason for the timeout", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    const duration = parseDuration(args[1]);
    if (!duration) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid duration. Use formats like `30m`, `1h`, `7d`.")] });
    if (duration > 28 * 86400000) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Maximum timeout duration is 28 days.")] });
    const reason = args.slice(2).join(" ") || "No reason provided";
    try {
      await target.timeout(duration, reason);
      const until = new Date(Date.now() + duration);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("mute")} Member Timed Out`).setDescription(`**User:** ${target.user.tag}\n**Duration:** ${args[1]}\n**Until:** <t:${Math.floor(until.getTime() / 1000)}:R>\n**Reason:** ${reason}`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const durationStr = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const duration = parseDuration(durationStr);
    if (!duration) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid duration. Use `30m`, `1h`, `7d`.")], ephemeral: true });
    if (duration > 28 * 86400000) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Max 28 days.")], ephemeral: true });
    try {
      await target.timeout(duration, reason);
      const until = new Date(Date.now() + duration);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("mute")} Member Timed Out`).setDescription(`**User:** ${target.user.tag}\n**Duration:** ${durationStr}\n**Until:** <t:${Math.floor(until.getTime() / 1000)}:R>\n**Reason:** ${reason}`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
