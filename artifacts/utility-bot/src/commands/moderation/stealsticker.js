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
import axios from "axios";

export default {
  name: "stealsticker",
  description: "Add a sticker from a replied message to the server",
  usage: "stealsticker (reply to a message with a sticker)",
  aliases: ["addsticker", "ss"],
  category: "moderation",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuildExpressions],
  permissions: [PermissionFlagsBits.ManageGuildExpressions],
  enabledSlash: true,
  slashData: {
    name: "stealsticker",
    description: "Add a sticker from another message to this server",
    options: [{ name: "message_id", description: "ID of a message that contains a sticker", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!message.reference) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(`Please reply to a message containing a sticker.\n\n**Usage:** \`${this.usage}\``);

      return message.reply({ embeds: [embed] });
    }

    try {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );

      if (!referencedMessage.stickers.size) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("cross")} No Sticker Found`)
          .setDescription("The replied message does not contain a sticker.");

        return message.reply({ embeds: [embed] });
      }

      const sticker = referencedMessage.stickers.first();
      const stickerURL = `https://media.discordapp.net/stickers/${sticker.id}.png`;
      const stickerName = sticker.name;

      await axios.head(stickerURL);

      const newSticker = await message.guild.stickers.create({
        file: stickerURL,
        name: stickerName,
        tags: sticker.tags || "fun",
      });

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("sticker")} Sticker Added`)
        .setDescription(
          `**Name:** ${newSticker.name}\n` +
          `**Added By:** ${message.author.tag}`
        );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Sticker Failed`)
        .setDescription(
          `Couldn't add the sticker. Possible reasons:\n` +
          `- Sticker slots full\n` +
          `- Invalid sticker URL\n` +
          `- Server limit reached`
        );

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const msgId = interaction.options.getString("message_id");
    await interaction.deferReply();
    const msg = await interaction.channel.messages.fetch(msgId).catch(() => null);
    if (!msg) return interaction.editReply({ content: "Message not found in this channel." });
    const sticker = msg.stickers?.first();
    if (!sticker) return interaction.editReply({ content: "That message doesn't have a sticker." });
    try {
      const newSticker = await interaction.guild.stickers.create({ file: sticker.url, name: sticker.name, tags: "fun" });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("sticker")} Sticker Added`).setDescription(`**${newSticker.name}** has been added to this server!`)] });
    } catch (e) {
      return interaction.editReply({ content: `Failed to add sticker: ${e.message}` });
    }
  },
};
