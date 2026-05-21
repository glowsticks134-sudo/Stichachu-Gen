import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vcundeafen",
  description: "Remove server deafen from a user in voice channel",
  usage: "vcundeafen <@user>",
  aliases: ["voiceundeafen", "vcundef", "vud"],
  category: "Voice",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.DeafenMembers],
  permissions: [PermissionFlagsBits.DeafenMembers],

  async execute({ client, message, args }) {
    if (!message.member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not Connected`)
        .setDescription("You must be connected to a voice channel first.");

      return message.reply({ embeds: [embed] });
    }

    const member = message.mentions.members.first() ||
                   (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please mention a user to voice undeafen.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not In Voice`)
        .setDescription(`${member} is not in a voice channel.`);

      return message.reply({ embeds: [embed] });
    }

    if (!member.voice.serverDeaf) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not Deafened`)
        .setDescription(`${member} is not server deafened.`);

      return message.reply({ embeds: [embed] });
    }

    try {
      await member.voice.setDeaf(false, `Voice undeafened by ${message.author.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Undeafened`)
        .setDescription(`Successfully removed server deafen from ${member}.`);

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Undeafen Failed`)
        .setDescription(`Failed to voice undeafen ${member}: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
