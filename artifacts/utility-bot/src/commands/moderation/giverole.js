import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "giverole",
  description: "Give a role to a member",
  usage: "giverole <@user> <@role>",
  aliases: ["addrole", "roleadd"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ManageRoles],
  permissions: [PermissionFlagsBits.ManageRoles],
  enabledSlash: true,
  slashData: {
    name: "giverole",
    description: "Give a role to a member",
    options: [
      { name: "user", description: "The member", type: 6, required: true },
      { name: "role", description: "The role to give", type: 8, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Role not found.")] });
    if (role.managed) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot assign managed roles.")] });
    if (target.roles.cache.has(role.id)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member already has this role.")] });
    try {
      await target.roles.add(role);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Given`).setDescription(`**${role.name}** has been given to **${target.user.tag}**.`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const role = interaction.options.getRole("role");
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")], ephemeral: true });
    if (role.managed) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot assign managed roles.")], ephemeral: true });
    if (target.roles.cache.has(role.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member already has this role.")], ephemeral: true });
    try {
      await target.roles.add(role);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Given`).setDescription(`**${role.name}** given to **${target.user.tag}**.`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
