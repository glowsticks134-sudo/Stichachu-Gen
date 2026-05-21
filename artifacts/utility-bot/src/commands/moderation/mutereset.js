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
  name: "mutereset",
  description: "Reset mute history for a user",
  usage: "mutereset <user>",
  aliases: ["mreset", "clearmutes"],
  category: "moderation",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.Administrator],
  enabledSlash: true,
  slashData: {
    name: "mutereset",
    description: "Reset mute history for a user",
    options: [{ name: "user", description: "User to clear mutes for", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please mention a user to reset mute history.\n\n**Usage:** \`${this.usage}\``);

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
      
      if (mutes.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("info")} No Mutes`)
          .setDescription(`${target.tag} has no mute history to reset.`);

        return message.reply({ embeds: [embed] });
      }

      db.resetMutes(message.guild.id, target.id);

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("reset")} Mute History Reset`)
        .setDescription(
          `**User:** ${target.tag}\n` +
          `**Mutes Cleared:** ${mutes.length}\n` +
          `**Moderator:** ${message.author.tag}`
        );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Error`)
        .setDescription(`Failed to reset mute history: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    const mutes = db.getMuteHistory(interaction.guild.id, target.id);
    if (!mutes.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} No Mutes`).setDescription(`${target.tag} has no mute history.`)], ephemeral: true });
    db.resetMutes(interaction.guild.id, target.id);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("reset")} Mute History Reset`).setDescription(`Cleared **${mutes.length}** mute(s) for ${target.tag}.`)] });
  },
};
