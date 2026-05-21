import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "voicekick",
  description: "Kick a member from a voice channel",
  usage: "voicekick <@user> [reason]",
  aliases: ["vkick", "vc-kick"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.MoveMembers],
  permissions: [PermissionFlagsBits.MoveMembers],
  enabledSlash: true,
  slashData: {
    name: "voicekick",
    description: "Kick a member from their voice channel",
    options: [
      { name: "user", description: "The member to kick from voice", type: 6, required: true },
      { name: "reason", description: "Reason", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!target.voice.channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member is not in a voice channel.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await target.voice.disconnect(reason);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("kick")} Voice Kicked`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")], ephemeral: true });
    if (!target.voice.channel) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member is not in a voice channel.")], ephemeral: true });
    try {
      await target.voice.disconnect(reason);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("kick")} Voice Kicked`).setDescription(`**User:** ${target.user.tag}\n**Reason:** ${reason}`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
