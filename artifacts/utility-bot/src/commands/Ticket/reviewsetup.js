import {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "reviewsetup",
  description: "Setup the review channel for ticket reviews",
  usage: "reviewsetup <panel_id> <#channel>",
  aliases: ["setreview", "reviewchannel"],
  category: "Ticket",
  cooldown: 5,

  async execute({ client, message, args }) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Permission`)
        .setDescription("You need Administrator permission to setup review channels.");

      return message.reply({ embeds: [embed] });
    }

    if (!args[0]) {
      const panels = db.getAllPanels(message.guild.id);
      
      if (panels.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("cross")} No Panels`)
          .setDescription("No ticket panels exist. Create a panel first using `panelsetup`.");

        return message.reply({ embeds: [embed] });
      }

      const panelList = panels.map(p => 
        `**Panel ${p.panel_id}:** ${p.panelTitle}\n` +
        `├─ Review Channel: ${p.reviewChannel ? `<#${p.reviewChannel}>` : 'Not set'}\n` +
        `└─ Transcript Channel: ${p.transcriptChannel ? `<#${p.transcriptChannel}>` : 'Not set'}`
      ).join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("ticketPanel")} Review Setup`)
        .setDescription(
          `**Usage:** \`reviewsetup <panel_id> <#channel>\`\n\n` +
          `**Available Panels:**\n${panelList}`
        );

      return message.reply({ embeds: [embed] });
    }

    const panelId = parseInt(args[0]);
    
    if (isNaN(panelId)) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Panel ID`)
        .setDescription("Please provide a valid panel ID number.");

      return message.reply({ embeds: [embed] });
    }

    const panel = db.getTicketPanel(message.guild.id, panelId);

    if (!panel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Panel Not Found`)
        .setDescription(`No panel found with ID ${panelId}.`);

      return message.reply({ embeds: [embed] });
    }

    const channel = message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[1]);

    if (!channel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Missing Channel`)
        .setDescription("Please mention a channel or provide a channel ID.");

      return message.reply({ embeds: [embed] });
    }

    if (channel.type !== ChannelType.GuildText) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Channel`)
        .setDescription("The review channel must be a text channel.");

      return message.reply({ embeds: [embed] });
    }

    try {
      db.updatePanel(message.guild.id, panelId, {
        review_channel: channel.id
      });

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Review Channel Set`)
        .setDescription(
          `**Panel:** ${panel.panelTitle} (ID: ${panelId})\n` +
          `**Review Channel:** ${channel}\n\n` +
          `User reviews and comments will now be sent to this channel.`
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Review setup error:", error);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Setup Failed`)
        .setDescription(`Failed to setup review channel: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
