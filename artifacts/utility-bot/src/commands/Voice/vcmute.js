import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vcmute",
  description: "Server mute a user in voice channel",
  usage: "vcmute <@user>",
  aliases: ["voicemute", "vm"],
  category: "Voice",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.MuteMembers],
  permissions: [PermissionFlagsBits.MuteMembers],
  enabledSlash: true,
  slashData: {
    name: "vcmute",
    description: "Server mute a user in voice channel",
    options: [{ name: "user", description: "The user to mute", type: 6, required: true }],
  },

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
        .setDescription(`Please mention a user to voice mute.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not In Voice`)
        .setDescription(`${member} is not in a voice channel.`);

      return message.reply({ embeds: [embed] });
    }

    if (member.voice.serverMute) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Already Muted`)
        .setDescription(`${member} is already server muted.`);

      return message.reply({ embeds: [embed] });
    }

    try {
      await member.voice.setMute(true, `Voice muted by ${message.author.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Muted`)
        .setDescription(`Successfully server muted ${member} in voice.`);

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Mute Failed`)
        .setDescription(`Failed to voice mute ${member}: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    if (!interaction.member.voice.channel) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Not Connected`).setDescription("You must be in a voice channel first.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const member = interaction.options.getMember("user");
    if (!member) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} User Not Found`).setDescription("Could not find that user.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!member.voice.channel) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Not In Voice`).setDescription(`${member} is not in a voice channel.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member.voice.serverMute) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Already Muted`).setDescription(`${member} is already server muted.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.voice.setMute(true, `Voice muted by ${interaction.user.tag}`);
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Voice Muted`).setDescription(`Muted ${member} in voice.`);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Mute Failed`).setDescription(`Failed: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
