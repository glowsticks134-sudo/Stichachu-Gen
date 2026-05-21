import {
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "retick",
  description: "Remove a user from the current ticket",
  usage: "retick <user>",
  aliases: ["removeuser", "ticketremove", "tremove"],
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
        .setDescription("You don't have permission to remove users from tickets.");

      return message.reply({ embeds: [embed] });
    }

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Missing User`)
        .setDescription("Please mention a user or provide their ID to remove from this ticket.");

      return message.reply({ embeds: [embed] });
    }

    const user =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} User Not Found`)
        .setDescription("Could not find that user in this server.");

      return message.reply({ embeds: [embed] });
    }

    if (user.id === ticketData.user_id) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Cannot Remove`)
        .setDescription("You cannot remove the ticket creator from their own ticket.");

      return message.reply({ embeds: [embed] });
    }

    try {
      await message.channel.permissionOverwrites.delete(user);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("ticketRemove")} User Removed`)
        .setDescription(
          `**User:** ${user}\n` +
          `**Removed By:** ${message.author}\n` +
          `**Ticket:** #${ticketData.ticket_id}`
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Failed to Remove User`)
        .setDescription(`Could not remove the user from this ticket: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },
};
