import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import emoji from "#config/emoji";

class EmbedCommand extends Command {
  constructor() {
    super({
      name: "embed",
      description: "Create and send a custom embed message",
      usage: "embed <title> | <description> | [color] | [image_url]",
      aliases: ["createembed", "sendembed"],
      category: "Extra",
      examples: [
        "embed Welcome | Welcome to our server!",
        "embed Rules | Follow the rules | #ff0000",
        "embed Hello | World | #00ff00 | https://example.com/image.png",
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageMessages],
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!args.length) {
        return message.reply({
          content: `${emoji.get("cross")} Please provide embed content!\n**Usage:** \`${this.usage}\``,
        });
      }

      const parts = args.join(" ").split("|").map((p) => p.trim());

      if (parts.length < 2) {
        return message.reply({
          content: `${emoji.get("cross")} Please provide at least a title and description separated by \`|\`\n**Usage:** \`${this.usage}\``,
        });
      }

      const [title, description, color, imageUrl] = parts;

      const embedColor = color && color.startsWith("#") 
        ? parseInt(color.replace("#", ""), 16) 
        : 0x5865F2;

      const embed = new EmbedBuilder()
        .setTitle(title || "Embed")
        .setDescription(description || "No description provided")
        .setColor(embedColor)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });

      if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
        embed.setImage(imageUrl);
      }

      await message.channel.send({ embeds: [embed] });

      await message.delete().catch(() => {});
    } catch (error) {
      client.logger?.error("EmbedCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while creating the embed.`,
      });
    }
  }
}

export default new EmbedCommand();
