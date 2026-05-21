import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "vclist",
  description: "List all users in your voice channel",
  usage: "vclist",
  aliases: ["voicelist", "vl", "vcmembers"],
  category: "Voice",
  cooldown: 3,
  userPermissions: [],
  permissions: [],

  async execute({ client, message, args }) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not Connected`)
        .setDescription("You must be connected to a voice channel first.");

      return message.reply({ embeds: [embed] });
    }

    const members = voiceChannel.members;
    const memberCount = members.size;

    if (memberCount === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Empty Channel`)
        .setDescription("There are no users in this voice channel.");

      return message.reply({ embeds: [embed] });
    }

    const memberList = members.map((m, index) => {
      let status = [];
      if (m.voice.selfMute) status.push("Self Muted");
      if (m.voice.selfDeaf) status.push("Self Deafened");
      if (m.voice.serverMute) status.push("Server Muted");
      if (m.voice.serverDeaf) status.push("Server Deafened");
      if (m.voice.streaming) status.push("Streaming");
      if (m.voice.selfVideo) status.push("Camera On");

      const statusText = status.length > 0 ? ` (${status.join(", ")})` : "";
      return `${m.user.bot ? "🤖" : "👤"} ${m.user.tag}${statusText}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle(`${emoji.get("check")} Voice Channel Members`)
      .setDescription(
        `**Channel:** ${voiceChannel.name}\n` +
        `**Members:** ${memberCount}\n\n` +
        memberList
      );

    return message.reply({ embeds: [embed] });
  },
};
