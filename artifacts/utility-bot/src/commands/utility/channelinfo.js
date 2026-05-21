import { EmbedBuilder, ChannelType } from "discord.js";
import emoji from "#config/emoji";

const channelTypeName = (type) => {
  const types = {
    [ChannelType.GuildText]: "Text Channel",
    [ChannelType.GuildVoice]: "Voice Channel",
    [ChannelType.GuildCategory]: "Category",
    [ChannelType.GuildAnnouncement]: "Announcement Channel",
    [ChannelType.GuildStageVoice]: "Stage Channel",
    [ChannelType.GuildForum]: "Forum Channel",
    [ChannelType.GuildThread]: "Thread",
    [ChannelType.PublicThread]: "Public Thread",
    [ChannelType.PrivateThread]: "Private Thread",
  };
  return types[type] || "Unknown";
};

export default {
  name: "channelinfo",
  description: "Get detailed information about a channel",
  usage: "channelinfo [#channel]",
  aliases: ["chinfo", "channel"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "channelinfo",
    description: "Get info about a channel",
    options: [{ name: "channel", description: "The channel to inspect", type: 7, required: false }],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
    return message.reply({ embeds: [buildChannelEmbed(channel)] });
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    return interaction.reply({ embeds: [buildChannelEmbed(channel)] });
  },
};

function buildChannelEmbed(channel) {
  const lines = [
    `**Name:** ${channel.name}`,
    `**ID:** ${channel.id}`,
    `**Type:** ${channelTypeName(channel.type)}`,
    `**Created:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
  ];

  if (channel.topic) lines.push(`**Topic:** ${channel.topic}`);
  if (channel.rateLimitPerUser) lines.push(`**Slowmode:** ${channel.rateLimitPerUser}s`);
  if (channel.nsfw !== undefined) lines.push(`**NSFW:** ${channel.nsfw ? "Yes" : "No"}`);
  if (channel.parent) lines.push(`**Category:** ${channel.parent.name}`);
  if (channel.position !== undefined) lines.push(`**Position:** ${channel.position}`);
  if (channel.bitrate) lines.push(`**Bitrate:** ${channel.bitrate / 1000}kbps`);
  if (channel.userLimit) lines.push(`**User Limit:** ${channel.userLimit}`);
  if (channel.members) lines.push(`**Members in Channel:** ${channel.members.size}`);

  return new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("channel")} Channel Info`).setDescription(lines.join("\n")).setTimestamp();
}
