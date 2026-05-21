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
  name: "muteinfo",
  description: "View mute history for a user",
  usage: "muteinfo <user>",
  aliases: ["minfo", "mutes"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  enabledSlash: true,
  slashData: {
    name: "muteinfo",
    description: "View mute history for a user",
    options: [{ name: "user", description: "User to check mutes for", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please mention a user to view mute info.\n\n**Usage:** \`${this.usage}\``);

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
      const mutes = db.getMuteHistory(message.guild.id, target.id);
      const activeMute = db.getActiveMute(message.guild.id, target.id);

      if (mutes.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("info")} No Mutes`)
          .setDescription(`${target.tag} has no mute history in this server.`);

        return message.reply({ embeds: [embed] });
      }

      let content = `**User:** ${target.tag}\n`;
      content += `**Total Mutes:** ${mutes.length}\n`;
      content += `**Currently Muted:** ${activeMute ? 'Yes' : 'No'}\n\n`;
      content += `**Recent Mutes:**\n`;

      const recentMutes = mutes.slice(0, 5);
      for (let i = 0; i < recentMutes.length; i++) {
        const mute = recentMutes[i];
        const moderator = await client.users.fetch(mute.moderator_id).catch(() => ({ tag: 'Unknown' }));
        const mutedAt = new Date(mute.muted_at);
        const duration = mute.duration ? `${Math.floor(mute.duration / 60000)} minutes` : 'Permanent';
        
        content += `\n**#${i + 1}**\n`;
        content += `├─ Reason: ${mute.reason}\n`;
        content += `├─ Duration: ${duration}\n`;
        content += `├─ Moderator: ${moderator.tag || moderator.username}\n`;
        content += `└─ Date: <t:${Math.floor(mutedAt.getTime() / 1000)}:R>\n`;
      }

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("mute")} Mute History`)
        .setDescription(content);

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Error`)
        .setDescription(`Failed to get mute info: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    try {
      const mutes = db.getMuteHistory(interaction.guild.id, target.id);
      if (mutes.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} No Mutes`).setDescription(`${target.tag} has no mute history.`)], ephemeral: true });
      let content = `**User:** ${target.tag}\n**Total:** ${mutes.length}\n\n`;
      mutes.slice(0, 5).forEach((m, i) => { content += `**#${i + 1}** — ${m.reason} (<t:${Math.floor(new Date(m.muted_at).getTime() / 1000)}:R>)\n`; });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("mute")} Mute History`).setDescription(content)], ephemeral: true });
    } catch (e) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(e.message)], ephemeral: true });
    }
  },
};
