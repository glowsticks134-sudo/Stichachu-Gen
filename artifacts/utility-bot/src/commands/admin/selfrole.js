import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "selfrole",
  description: "Manage self-assignable roles that members can give themselves",
  usage: "selfrole <add <@role> | remove <@role> | list | get <@role>>",
  aliases: ["iam", "selfroles"],
  category: "admin",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "selfrole",
    description: "Manage or claim self-assignable roles",
    options: [
      { name: "add", description: "[Admin] Add a self-assignable role", type: 1, options: [{ name: "role", description: "Role to add", type: 8, required: true }] },
      { name: "remove", description: "[Admin] Remove a self-assignable role", type: 1, options: [{ name: "role", description: "Role to remove", type: 8, required: true }] },
      { name: "list", description: "List all self-assignable roles", type: 1 },
      { name: "get", description: "Assign yourself a self-role", type: 1, options: [{ name: "role", description: "Role to get", type: 8, required: true }] },
      { name: "give", description: "Remove a self-role from yourself", type: 1, options: [{ name: "role", description: "Role to remove", type: 8, required: true }] },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    const guildId = message.guild.id;

    if (sub === "list") {
      const roleIds = db.getSelfroles(guildId);
      const roles = roleIds.map(id => message.guild.roles.cache.get(id)).filter(Boolean);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("role")} Self-Assignable Roles`).setDescription(roles.length ? roles.map(r => `• ${r}`).join("\n") : "No self-assignable roles set up.")] });
    }

    if (sub === "get") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid role.")] });
      if (!db.isSelfrole(guildId, role.id)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That role is not self-assignable.")] });
      if (message.member.roles.cache.has(role.id)) {
        await message.member.roles.remove(role);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Removed`).setDescription(`Removed ${role} from you.`)] });
      }
      await message.member.roles.add(role);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Given`).setDescription(`You now have ${role}.`)] });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Permission Denied`).setDescription("You need Manage Roles to modify self-roles.")] });
    }

    if (sub === "add") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid role.")] });
      db.addSelfrole(guildId, role.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Self-Role Added`).setDescription(`${role} is now self-assignable.`)] });
    }

    if (sub === "remove") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid role.")] });
      db.removeSelfrole(guildId, role.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Self-Role Removed`).setDescription(`${role} is no longer self-assignable.`)] });
    }

    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "list") {
      const roleIds = db.getSelfroles(guildId);
      const roles = roleIds.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("role")} Self-Assignable Roles`).setDescription(roles.length ? roles.map(r => `• ${r}`).join("\n") : "No self-roles set up.")], ephemeral: true });
    }

    if (sub === "get") {
      const role = interaction.options.getRole("role");
      if (!db.isSelfrole(guildId, role.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That role is not self-assignable.")], ephemeral: true });
      if (interaction.member.roles.cache.has(role.id)) {
        await interaction.member.roles.remove(role);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Removed`).setDescription(`Removed ${role} from you.`)], ephemeral: true });
      }
      await interaction.member.roles.add(role);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Given`).setDescription(`You now have ${role}.`)], ephemeral: true });
    }

    if (sub === "give") {
      const role = interaction.options.getRole("role");
      if (!db.isSelfrole(guildId, role.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That role is not self-assignable.")], ephemeral: true });
      if (interaction.member.roles.cache.has(role.id)) {
        await interaction.member.roles.remove(role);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Removed`).setDescription(`Removed ${role}.`)], ephemeral: true });
      }
      await interaction.member.roles.add(role);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Role Given`).setDescription(`You now have ${role}.`)], ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Permission Denied`).setDescription("You need Manage Roles.")], ephemeral: true });
    }

    const role = interaction.options.getRole("role");
    if (sub === "add") {
      db.addSelfrole(guildId, role.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Self-Role Added`).setDescription(`${role} is now self-assignable.`)] });
    }
    if (sub === "remove") {
      db.removeSelfrole(guildId, role.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Self-Role Removed`).setDescription(`${role} is no longer self-assignable.`)] });
    }
  },
};
