import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "massrole",
  description: "Add or remove a role from all server members",
  usage: "massrole <add|remove> <@role>",
  aliases: ["rolemass", "allrole"],
  category: "admin",
  cooldown: 30,
  userPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.Administrator],
  permissions: [PermissionFlagsBits.ManageRoles],
  enabledSlash: true,
  slashData: {
    name: "massrole",
    description: "Add or remove a role from all members",
    options: [
      {
        name: "action",
        description: "add or remove",
        type: 3,
        required: true,
        choices: [
          { name: "add", value: "add" },
          { name: "remove", value: "remove" },
        ],
      },
      { name: "role", description: "The role to mass assign/remove", type: 8, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const action = args[0]?.toLowerCase();
    if (!["add", "remove"].includes(action)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    }
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid role.")] });
    if (role.managed) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot use managed/integration roles.")] });

    const statusMsg = await message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} Processing`).setDescription(`${action === "add" ? "Adding" : "Removing"} ${role} ${action === "add" ? "to" : "from"} all members...`)] });

    try {
      const members = await message.guild.members.fetch();
      let success = 0, fail = 0;
      for (const [, member] of members) {
        if (member.user.bot) continue;
        try {
          if (action === "add" && !member.roles.cache.has(role.id)) { await member.roles.add(role); success++; }
          else if (action === "remove" && member.roles.cache.has(role.id)) { await member.roles.remove(role); success++; }
        } catch { fail++; }
      }
      await statusMsg.edit({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mass Role Complete`).setDescription(`**Action:** ${action}\n**Role:** ${role}\n**Success:** ${success}\n**Failed:** ${fail}`)] });
    } catch (error) {
      await statusMsg.edit({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(`Failed: ${error.message}`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const action = interaction.options.getString("action");
    const role = interaction.options.getRole("role");
    if (role.managed) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Cannot use managed/integration roles.")], ephemeral: true });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} Processing`).setDescription(`${action === "add" ? "Adding" : "Removing"} ${role} ${action === "add" ? "to" : "from"} all members...`)] });

    try {
      const members = await interaction.guild.members.fetch();
      let success = 0, fail = 0;
      for (const [, member] of members) {
        if (member.user.bot) continue;
        try {
          if (action === "add" && !member.roles.cache.has(role.id)) { await member.roles.add(role); success++; }
          else if (action === "remove" && member.roles.cache.has(role.id)) { await member.roles.remove(role); success++; }
        } catch { fail++; }
      }
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mass Role Complete`).setDescription(`**Action:** ${action}\n**Role:** ${role}\n**Success:** ${success}\n**Failed:** ${fail}`)] });
    } catch (error) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(`Failed: ${error.message}`)] });
    }
  },
};
