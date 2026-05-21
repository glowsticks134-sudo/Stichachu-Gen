import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "slowmode",
  description: "Set the slowmode for a channel",
  usage: "slowmode <seconds|off> [#channel]",
  aliases: ["slow", "ratelimit"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  permissions: [PermissionFlagsBits.ManageChannels],
  enabledSlash: true,
  slashData: {
    name: "slowmode",
    description: "Set slowmode in a channel",
    options: [
      { name: "seconds", description: "Slowmode in seconds (0 to disable)", type: 4, required: true, min_value: 0, max_value: 21600 },
      { name: "channel", description: "Channel to set slowmode in (default: current)", type: 7, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const rawVal = args[0];
    if (!rawVal) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    const seconds = rawVal.toLowerCase() === "off" ? 0 : parseInt(rawVal);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Seconds must be between 0 and 21600.")] });
    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.setRateLimitPerUser(seconds);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("lock")} Slowmode Updated`).setDescription(seconds === 0 ? `Slowmode disabled in ${channel}.` : `Slowmode set to **${seconds}s** in ${channel}.`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const seconds = interaction.options.getInteger("seconds");
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    try {
      await channel.setRateLimitPerUser(seconds);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("lock")} Slowmode Updated`).setDescription(seconds === 0 ? `Slowmode disabled in ${channel}.` : `Slowmode set to **${seconds}s** in ${channel}.`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
