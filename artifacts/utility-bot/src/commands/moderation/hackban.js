import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "hackban",
  description: "Ban a user by ID even if they are not in the server",
  usage: "hackban <user_id> [reason]",
  aliases: ["hb", "forceban"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.BanMembers],
  permissions: [PermissionFlagsBits.BanMembers],
  enabledSlash: true,
  slashData: {
    name: "hackban",
    description: "Ban a user by ID even if they are not in the server",
    options: [
      { name: "user_id", description: "The user ID to ban", type: 3, required: true },
      { name: "reason", description: "Reason for the ban", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please provide a user ID to hackban.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    const userId = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (!/^\d{17,19}$/.test(userId)) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid User ID`)
        .setDescription("Please provide a valid Discord user ID.");

      return message.reply({ embeds: [embed] });
    }

    if (userId === message.author.id) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Target`)
        .setDescription("You cannot hackban yourself.");

      return message.reply({ embeds: [embed] });
    }

    try {
      const existingBan = await message.guild.bans.fetch(userId).catch(() => null);
      
      if (existingBan) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("cross")} Already Banned`)
          .setDescription("This user is already banned from this server.");

        return message.reply({ embeds: [embed] });
      }

      await message.guild.members.ban(userId, { reason, deleteMessageSeconds: 604800 });

      const user = await client.users.fetch(userId).catch(() => null);

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("ban")} User Hackbanned`)
        .setDescription(
          `**User:** ${user ? user.tag : userId}\n` +
          `**User ID:** ${userId}\n` +
          `**Reason:** ${reason}`
        );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Hackban Failed`)
        .setDescription(`Failed to hackban the user: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const userId = interaction.options.getString("user_id").replace(/[<@!>]/g, '');
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!/^\d{17,19}$/.test(userId)) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Invalid User ID`).setDescription("Please provide a valid Discord user ID.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userId === interaction.user.id) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Invalid Target`).setDescription("You cannot hackban yourself.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const existingBan = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (existingBan) {
        const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Already Banned`).setDescription("This user is already banned.");
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.guild.members.ban(userId, { reason, deleteMessageSeconds: 604800 });
      const user = await client.users.fetch(userId).catch(() => null);

      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Support").setURL(config.links.supportServer).setStyle(ButtonStyle.Link));
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("ban")} User Hackbanned`).setDescription(`**User:** ${user ? user.tag : userId}\n**User ID:** ${userId}\n**Reason:** ${reason}`);
      return interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Hackban Failed`).setDescription(`Failed: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
