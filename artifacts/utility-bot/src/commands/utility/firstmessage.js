import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "firstmessage",
  description: "Get a link to the first message in a channel",
  usage: "firstmessage [#channel]",
  aliases: ["firstmsg", "channelstart"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: {
    name: "firstmessage",
    description: "Get a link to the first message in a channel",
    options: [{ name: "channel", description: "Channel (default: current)", type: 7, required: false }],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
    try {
      const messages = await channel.messages.fetch({ limit: 1, after: "0" });
      const first = messages.first();
      if (!first) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Could not find the first message.")] });
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("channel")} First Message in #${channel.name}`).setDescription(`[Click to jump](${first.url})\n\n**Author:** ${first.author.tag}\n**Sent:** <t:${Math.floor(first.createdTimestamp / 1000)}:F>`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    try {
      const messages = await channel.messages.fetch({ limit: 1, after: "0" });
      const first = messages.first();
      if (!first) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Could not find the first message.")], ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("channel")} First Message in #${channel.name}`).setDescription(`[Click to jump](${first.url})\n\n**Author:** ${first.author.tag}\n**Sent:** <t:${Math.floor(first.createdTimestamp / 1000)}:F>`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
