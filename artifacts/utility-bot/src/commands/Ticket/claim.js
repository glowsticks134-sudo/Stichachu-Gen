import {
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "claim",
  description: "Claim the current ticket",
  usage: "claim",
  aliases: ["claimticket"],
  category: "Ticket",
  cooldown: 3,

  async execute({ client, message, args }) {
    const ticketData = db.getTicket(message.channel.id);

    if (!ticketData) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Not a Ticket`)
        .setDescription("This command can only be used in a ticket channel.");

      return message.reply({ embeds: [embed] });
    }

    if (ticketData.claimed_by) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Already Claimed`)
        .setDescription(`This ticket is already claimed by <@${ticketData.claimed_by}>.`);

      return message.reply({ embeds: [embed] });
    }

    const panel = db.getTicketPanel(message.guild.id, ticketData.panel_id);

    if (!panel) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Panel Not Found`)
        .setDescription("The ticket panel configuration was not found.");

      return message.reply({ embeds: [embed] });
    }

    const hasPermission =
      message.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      panel.supportRoles.some((roleId) =>
        message.member.roles.cache.has(roleId)
      );

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Permission`)
        .setDescription("You don't have permission to claim tickets.");

      return message.reply({ embeds: [embed] });
    }

    db.claimTicket(message.channel.id, message.author.id);

    if (panel.categoryClaimed) {
      try {
        await message.channel.setParent(panel.categoryClaimed);
      } catch (error) {
        console.error("Failed to move ticket to claimed category:", error);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle(`${emoji.get("ticketClaim")} Ticket Claimed`)
      .setDescription(
        `**Claimed By:** ${message.author}\n` +
        `**Ticket:** #${ticketData.ticket_id}\n` +
        `**Category:** ${ticketData.category || "General"}`
      );

    return message.channel.send({ embeds: [embed] });
  },
};
