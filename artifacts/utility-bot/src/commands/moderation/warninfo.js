import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "warninfo",
  description: "View warning history for a user",
  usage: "warninfo <user>",
  aliases: ["winfo", "warnings", "warns"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  enabledSlash: true,
  slashData: {
    name: "warninfo",
    description: "View warning history for a user",
    options: [{ name: "user", description: "User to check warnings for", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please mention a user to view warn info.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first() || 
                   await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} User Not Found`)
        .setDescription("Could not find that user.");

      return message.reply({ embeds: [embed] });
    }

    try {
      const warns = db.getWarns(message.guild.id, target.id);

      if (warns.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("info")} No Warnings`)
          .setDescription(`${target.tag} has no warnings in this server.`);

        return message.reply({ embeds: [embed] });
      }

      let content = `**User:** ${target.tag}\n`;
      content += `**Total Warnings:** ${warns.length}\n\n`;
      content += `**Warning History:**\n`;

      const recentWarns = warns.slice(0, 5);
      for (let i = 0; i < recentWarns.length; i++) {
        const warn = recentWarns[i];
        const moderator = await client.users.fetch(warn.moderator_id).catch(() => ({ tag: 'Unknown' }));
        const warnedAt = new Date(warn.warned_at);
        
        content += `\n**#${i + 1}**\n`;
        content += `├─ Reason: ${warn.reason}\n`;
        content += `├─ Moderator: ${moderator.tag || moderator.username}\n`;
        content += `└─ Date: <t:${Math.floor(warnedAt.getTime() / 1000)}:R>\n`;
      }

      if (warns.length > 5) {
        content += `\n*...and ${warns.length - 5} more warnings*`;
      }

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("warn")} Warning History`)
        .setDescription(content);

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Error`)
        .setDescription(`Failed to get warn info: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    try {
      const warns = db.getWarns(interaction.guild.id, target.id);
      if (warns.length === 0) {
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} No Warnings`).setDescription(`${target.tag} has no warnings.`)], ephemeral: true });
      }
      let content = `**User:** ${target.tag}\n**Total:** ${warns.length}\n\n`;
      warns.slice(0, 5).forEach((w, i) => { content += `**#${i + 1}** — ${w.reason} (<t:${Math.floor(new Date(w.warned_at).getTime() / 1000)}:R>)\n`; });
      if (warns.length > 5) content += `*...and ${warns.length - 5} more*`;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("warn")} Warning History`).setDescription(content)], ephemeral: true });
    } catch (e) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(e.message)], ephemeral: true });
    }
  },
};
