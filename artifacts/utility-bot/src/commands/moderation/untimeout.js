import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "untimeout",
  description: "Remove a timeout from a member",
  usage: "untimeout <@user> [reason]",
  aliases: ["unmute", "uto"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  permissions: [PermissionFlagsBits.ModerateMembers],
  enabledSlash: true,
  slashData: {
    name: "untimeout",
    description: "Remove a timeout from a member",
    options: [
      { name: "user", description: "The member to untimeout", type: 6, required: true },
      { name: "reason", description: "Reason", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!target.isCommunicationDisabled()) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member is not timed out.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await target.timeout(null, reason);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unmute")} Timeout Removed`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    if (!target.isCommunicationDisabled()) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member is not timed out.")], ephemeral: true });
    try {
      await target.timeout(null, reason);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unmute")} Timeout Removed`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
