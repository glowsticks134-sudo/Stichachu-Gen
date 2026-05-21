import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "deafen",
  description: "Server deafen a member in a voice channel",
  usage: "deafen <@user> [reason]",
  aliases: ["serverdeafen"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.DeafenMembers],
  permissions: [PermissionFlagsBits.DeafenMembers],
  enabledSlash: true,
  slashData: {
    name: "deafen",
    description: "Server-deafen a member in voice",
    options: [
      { name: "user", description: "The member to deafen", type: 6, required: true },
      { name: "reason", description: "Reason", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!target.voice.channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is not in a voice channel.")] });
    if (target.voice.serverDeaf) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is already server deafened.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.voice.setDeaf(true, reason);
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("mute")} Member Deafened`).setDescription(`**${target.user.tag}** has been server deafened.\n**Reason:** ${reason}`)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")], ephemeral: true });
    if (!target.voice.channel) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is not in a voice channel.")], ephemeral: true });
    await target.voice.setDeaf(true, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("mute")} Member Deafened`).setDescription(`**${target.user.tag}** has been server deafened.`)] });
  },
};
