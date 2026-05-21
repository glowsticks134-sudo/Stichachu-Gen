import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "removerole",
  description: "Remove a role from a member",
  usage: "removerole <@user> <@role>",
  aliases: ["roletake", "takerole"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ManageRoles],
  permissions: [PermissionFlagsBits.ManageRoles],
  enabledSlash: true,
  slashData: {
    name: "removerole",
    description: "Remove a role from a member",
    options: [
      { name: "user", description: "The member", type: 6, required: true },
      { name: "role", description: "The role to remove", type: 8, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Role not found.")] });
    if (!target.roles.cache.has(role.id)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member doesn't have this role.")] });
    try {
      await target.roles.remove(role);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Removed`).setDescription(`**${role.name}** removed from **${target.user.tag}**.`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const role = interaction.options.getRole("role");
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")], ephemeral: true });
    if (!target.roles.cache.has(role.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member doesn't have this role.")], ephemeral: true });
    try {
      await target.roles.remove(role);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Removed`).setDescription(`**${role.name}** removed from **${target.user.tag}**.`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
