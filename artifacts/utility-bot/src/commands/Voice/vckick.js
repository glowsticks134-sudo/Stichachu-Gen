import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vckick",
  description: "Disconnect a user from voice channel",
  usage: "vckick <@user>",
  aliases: ["voicekick", "vk", "vcdisconnect"],
  category: "Voice",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.MoveMembers],
  permissions: [PermissionFlagsBits.MoveMembers],
  enabledSlash: true,
  slashData: {
    name: "vckick",
    description: "Disconnect a user from voice channel",
    options: [
      { name: "user", description: "The user to disconnect", type: 6, required: true },
    ],
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
        .setDescription(`Please mention a user to kick from voice.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not In Voice`)
        .setDescription(`${member} is not in a voice channel.`);

      return message.reply({ embeds: [embed] });
    }

    if (member.id === message.author.id) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Target`)
        .setDescription("You cannot kick yourself from voice.");

      return message.reply({ embeds: [embed] });
    }

    try {
      const channelName = member.voice.channel.name;
      await member.voice.disconnect(`Voice kicked by ${message.author.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Voice Kicked`)
        .setDescription(`Successfully disconnected ${member} from **${channelName}**.`);

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Kick Failed`)
        .setDescription(`Failed to voice kick ${member}: ${error.message}`);

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

    if (member.id === interaction.user.id) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Invalid Target`).setDescription("You cannot kick yourself from voice.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const channelName = member.voice.channel.name;
      await member.voice.disconnect(`Voice kicked by ${interaction.user.tag}`);
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Voice Kicked`).setDescription(`Disconnected ${member} from **${channelName}**.`);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Kick Failed`).setDescription(`Failed: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
