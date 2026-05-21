import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "massban",
  description: "Ban multiple users at once by their IDs",
  usage: "massban <id1> <id2> ... [reason]",
  aliases: ["bulkban", "banmass"],
  category: "moderation",
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.Administrator],
  permissions: [PermissionFlagsBits.BanMembers],
  enabledSlash: true,
  slashData: {
    name: "massban",
    description: "Ban multiple users by IDs (space separated)",
    options: [
      { name: "ids", description: "Space-separated user IDs", type: 3, required: true },
      { name: "reason", description: "Reason for the mass ban", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const ids = args.filter(a => /^\d{17,20}$/.test(a));
    const reason = args.filter(a => !/^\d{17,20}$/.test(a)).join(" ") || "Mass ban";
    if (ids.length === 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide valid user IDs.")] });

    const status = await message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} Mass Banning`).setDescription(`Banning ${ids.length} users...`)] });
    let success = 0, fail = 0;
    for (const id of ids) {
      try { await message.guild.members.ban(id, { reason, deleteMessageSeconds: 604800 }); success++; }
      catch { fail++; }
    }
    return status.edit({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("ban")} Mass Ban Complete`).setDescription(`**Banned:** ${success}\n**Failed:** ${fail}\n**Reason:** ${reason}`)] });
  },

  async slashExecute({ client, interaction }) {
    const idsStr = interaction.options.getString("ids");
    const reason = interaction.options.getString("reason") || "Mass ban";
    const ids = idsStr.split(/\s+/).filter(a => /^\d{17,20}$/.test(a));
    if (ids.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("No valid IDs provided.")], ephemeral: true });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} Mass Banning`).setDescription(`Banning ${ids.length} users...`)] });
    let success = 0, fail = 0;
    for (const id of ids) {
      try { await interaction.guild.members.ban(id, { reason, deleteMessageSeconds: 604800 }); success++; }
      catch { fail++; }
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("ban")} Mass Ban Complete`).setDescription(`**Banned:** ${success}\n**Failed:** ${fail}\n**Reason:** ${reason}`)] });
  },
};
