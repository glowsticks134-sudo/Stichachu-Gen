import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "softban",
  description: "Ban and immediately unban a user to delete their messages",
  usage: "softban <@user> [reason]",
  aliases: ["sban"],
  category: "moderation",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.BanMembers],
  permissions: [PermissionFlagsBits.BanMembers],
  enabledSlash: true,
  slashData: {
    name: "softban",
    description: "Softban a user (ban+unban to clear messages)",
    options: [
      { name: "user", description: "The user to softban", type: 6, required: true },
      { name: "reason", description: "Reason for the softban", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("User not found.")] });
    if (target.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("You cannot softban yourself.")] });
    if (!target.bannable) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("I cannot ban this user.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await target.ban({ reason: `Softban: ${reason}`, deleteMessageSeconds: 604800 });
      await message.guild.members.unban(target.id, "Softban unban");
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("ban")} User Softbanned`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("User not found.")], ephemeral: true });
    if (!target.bannable) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("I cannot ban this user.")], ephemeral: true });
    try {
      await target.ban({ reason: `Softban: ${reason}`, deleteMessageSeconds: 604800 });
      await interaction.guild.members.unban(target.id, "Softban unban");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("ban")} User Softbanned`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
