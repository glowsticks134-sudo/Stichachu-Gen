import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

const lickGifs = [
  "https://media.tenor.com/aFxOMVjzVrMAAAAC/lick-anime.gif",
  "https://media.tenor.com/AVJK8-0_7DkAAAAC/anime-lick.gif",
  "https://media.tenor.com/2-ILQGnLQpkAAAAC/zero-two-anime.gif",
  "https://media.tenor.com/5g5U-NhIERAAAAAC/anime-lick.gif",
  "https://media.tenor.com/Z4akPUwHdRkAAAAC/anime-lick.gif",
];

class LickCommand extends Command {
  constructor() {
    super({
      name: "lick",
      description: "Lick someone (anime style!)",
      usage: "lick <@user>",
      aliases: ["licku"],
      category: "Fun",
      examples: ["lick @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "lick",
        description: "Lick someone (anime style!)",
        options: [{ name: "user", description: "Target user", type: 6, required: true }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first() || 
                     (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

      if (!target) {
        return message.reply({
          content: `${emoji.get("cross")} Please mention someone to lick!\n**Usage:** \`${this.usage}\``,
        });
      }

      if (target.id === message.author.id) {
        return message.reply({
          content: `${emoji.get("cross")} You can't lick yourself! That's weird...`,
        });
      }

      const randomGif = lickGifs[Math.floor(Math.random() * lickGifs.length)];

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("heart")} **${message.author.username}** licked **${target.user.username}**!`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const gallery = new MediaGalleryBuilder()
        .addItems(
          new MediaGalleryItemBuilder().setURL(randomGif)
        );
      container.addMediaGalleryComponents(gallery);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `*How does that taste?*`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("LickCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "You can't lick yourself... or can you? 👅", ephemeral: true });
    await interaction.reply({ content: `${emoji.get("heart")} **${interaction.user.username}** licked **${target.user.username}**! 👅` });
  }
}

export default new LickCommand();
