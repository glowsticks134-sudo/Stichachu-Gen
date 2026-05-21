import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "autorole",
  description: "Set a role to automatically give to new members",
  usage: "autorole <set <role> | remove | view>",
  aliases: ["joinrole"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  permissions: [PermissionFlagsBits.ManageRoles],
  enabledSlash: true,
  slashData: {
    name: "autorole",
    description: "Configure the autorole for new members",
    options: [
      {
        name: "set",
        description: "Set the autorole",
        type: 1,
        options: [{ name: "role", description: "Role to give new members", type: 8, required: true }],
      },
      { name: "remove", description: "Remove the autorole", type: 1 },
      { name: "view", description: "View current autorole setting", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub || !["set", "remove", "view"].includes(sub)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    }

    if (sub === "view") {
      const roleId = db.getAutorole(message.guild.id);
      const role = roleId ? message.guild.roles.cache.get(roleId) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("role")} Autorole`).setDescription(role ? `Current autorole: ${role}` : "No autorole set.")] });
    }

    if (sub === "remove") {
      db.clearAutorole(message.guild.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Autorole Removed`).setDescription("Autorole has been disabled.")] });
    }

    if (sub === "set") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a valid role.")] });
      if (role.managed) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot use managed/bot roles.")] });
      db.setAutorole(message.guild.id, role.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Autorole Set`).setDescription(`New members will now receive ${role}.`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();

    if (sub === "view") {
      const roleId = db.getAutorole(interaction.guild.id);
      const role = roleId ? interaction.guild.roles.cache.get(roleId) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("role")} Autorole`).setDescription(role ? `Current autorole: ${role}` : "No autorole set.")], ephemeral: true });
    }

    if (sub === "remove") {
      db.clearAutorole(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Autorole Removed`).setDescription("Autorole has been disabled.")] });
    }

    if (sub === "set") {
      const role = interaction.options.getRole("role");
      if (role.managed) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot use managed/bot roles.")], ephemeral: true });
      db.setAutorole(interaction.guild.id, role.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Autorole Set`).setDescription(`New members will now receive ${role}.`)] });
    }
  },
};
