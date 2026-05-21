import {
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "delete",
  description: "Permanently delete a closed ticket channel",
  usage: "delete",
  aliases: ["deleteticket", "delticket"],
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
        .setDescription("You don't have permission to delete this ticket. Only staff members can delete tickets.");

      return message.reply({ embeds: [embed] });
    }

    if (!ticketData.closed_at) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Ticket Not Closed`)
        .setDescription("This ticket must be closed before it can be deleted. Use the `close` command first.");

      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle(`${emoji.get("ticketClose")} Deleting Ticket...`)
      .setDescription(
        `**Deleted By:** ${message.author}\n` +
        `**Ticket:** #${ticketData.ticket_id}\n\n` +
        `This channel will be deleted in **5 seconds**.`
      );

    await message.channel.send({ embeds: [embed] });

    db.deleteTicket(message.channel.id);

    setTimeout(async () => {
      try {
        await message.channel.delete();
      } catch (error) {
        console.error("Channel deletion error:", error);
      }
    }, 5000);
  },
};
