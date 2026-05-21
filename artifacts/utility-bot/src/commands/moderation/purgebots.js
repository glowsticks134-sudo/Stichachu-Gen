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
  name: "purgebots",
  description: "Delete messages from bots",
  usage: "purgebots <amount>",
  aliases: ["clearbots", "prunebots"],
  category: "moderation",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  permissions: [PermissionFlagsBits.ManageMessages],
  enabledSlash: true,
  slashData: {
    name: "purgebots",
    description: "Delete bot messages from this channel",
    options: [{ name: "amount", description: "Number of messages to scan (1-100)", type: 4, required: false, min_value: 1, max_value: 100 }],
  },

  async execute({ client, message, args }) {
    const amount = parseInt(args[0]) || 100;

    if (amount < 1 || amount > 100) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Amount`)
        .setDescription("Please provide a number between 1 and 100.");

      return message.reply({ embeds: [embed] });
    }

    try {
      await message.delete().catch(() => {});

      let messages = await message.channel.messages.fetch({ limit: 100 });
      
      messages = messages.filter(m => m.author.bot);
      messages = messages.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      
      const toDelete = [...messages.values()].slice(0, amount);
      const deleted = await message.channel.bulkDelete(toDelete, true);

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("purge")} Bot Messages Purged`)
        .setDescription(
          `**Deleted:** ${deleted.size} bot messages\n` +
          `**Moderator:** ${message.author.tag}`
        );

      const reply = await message.channel.send({ embeds: [embed], components: [row] });

      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Purge Failed`)
        .setDescription(`Failed to purge bot messages: ${error.message}`);

      return message.channel.send({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const amount = interaction.options.getInteger("amount") || 100;
    await interaction.deferReply({ ephemeral: true });
    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    messages = messages.filter(m => m.author.bot && Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
    const toDelete = [...messages.values()].slice(0, amount);
    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(() => ({ size: 0 }));
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("purge")} Bot Messages Purged`).setDescription(`**Deleted:** ${deleted.size} bot messages`)] });
  },
};
