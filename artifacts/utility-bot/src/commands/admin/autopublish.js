import { EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "autopublish",
  description: "Auto-publish messages sent in announcement channels",
  usage: "autopublish <add <#channel> | remove <#channel> | list>",
  aliases: ["autoannounce", "autopub"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  permissions: [PermissionFlagsBits.ManageMessages],
  enabledSlash: true,
  slashData: {
    name: "autopublish",
    description: "Auto-publish messages in announcement channels",
    options: [
      { name: "add", description: "Enable auto-publish for a channel", type: 1, options: [{ name: "channel", description: "Announcement channel", type: 7, required: true }] },
      { name: "remove", description: "Disable auto-publish for a channel", type: 1, options: [{ name: "channel", description: "Announcement channel", type: 7, required: true }] },
      { name: "list", description: "List all auto-publish channels", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    const guildId = message.guild.id;

    if (sub === "list") {
      const channelIds = db.getAutopublishChannels(guildId);
      const channels = channelIds.map(id => message.guild.channels.cache.get(id)).filter(Boolean);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto-Publish Channels`).setDescription(channels.length ? channels.map(c => `• ${c}`).join("\n") : "No auto-publish channels configured.")] });
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid channel.")] });
    if (channel.type !== ChannelType.GuildAnnouncement) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That channel is not an announcement channel.")] });

    if (sub === "add") {
      db.addAutopublish(guildId, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto-Publish Enabled`).setDescription(`Messages in ${channel} will be automatically published.`)] });
    }
    if (sub === "remove") {
      db.removeAutopublish(guildId, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto-Publish Disabled`).setDescription(`Auto-publish removed for ${channel}.`)] });
    }
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "list") {
      const channelIds = db.getAutopublishChannels(guildId);
      const channels = channelIds.map(id => interaction.guild.channels.cache.get(id)).filter(Boolean);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto-Publish Channels`).setDescription(channels.length ? channels.map(c => `• ${c}`).join("\n") : "No channels configured.")], ephemeral: true });
    }

    const channel = interaction.options.getChannel("channel");
    if (channel.type !== ChannelType.GuildAnnouncement) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That channel is not an announcement channel.")], ephemeral: true });

    if (sub === "add") {
      db.addAutopublish(guildId, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto-Publish Enabled`).setDescription(`Messages in ${channel} will be automatically published.`)] });
    }
    if (sub === "remove") {
      db.removeAutopublish(guildId, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto-Publish Disabled`).setDescription(`Auto-publish disabled for ${channel}.`)] });
    }
  },
};
