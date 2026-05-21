import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "undeafen",
  description: "Remove server deafen from a member",
  usage: "undeafen <@user> [reason]",
  aliases: ["serverundeafen"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.DeafenMembers],
  permissions: [PermissionFlagsBits.DeafenMembers],
  enabledSlash: true,
  slashData: {
    name: "undeafen",
    description: "Remove server-deafen from a member",
    options: [
      { name: "user", description: "The member to undeafen", type: 6, required: true },
      { name: "reason", description: "Reason", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!target.voice.serverDeaf) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is not server deafened.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.voice.setDeaf(false, reason);
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unmute")} Member Undeafened`).setDescription(`**${target.user.tag}** can now hear again.\n**Reason:** ${reason}`)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    if (!target.voice.serverDeaf) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is not server deafened.")], ephemeral: true });
    await target.voice.setDeaf(false, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unmute")} Member Undeafened`).setDescription(`**${target.user.tag}** can now hear again.`)] });
  },
};
