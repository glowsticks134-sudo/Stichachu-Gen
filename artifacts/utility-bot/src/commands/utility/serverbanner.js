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
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

class ServerBannerCommand extends Command {
  constructor() {
    super({
      name: "serverbanner",
      description: "Display the server's banner",
      usage: "serverbanner",
      aliases: ["sbanner", "guildbanner"],
      category: "utility",
      examples: ["serverbanner"],
      cooldown: 5,
      enabledSlash: true,
      slashData: { name: "serverbanner", description: "Display the server's banner" },
    });
  }

  async execute({ client, message, args }) {
    try {
      const { guild } = message;

      const bannerURL = guild.bannerURL({ dynamic: true, size: 4096 });

      if (!bannerURL) {
        return message.reply({
          content: `${emoji.get("cross")} This server doesn't have a banner!`,
        });
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("banner")} **${guild.name}'s Banner**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const gallery = new MediaGalleryBuilder()
        .addItems(
          new MediaGalleryItemBuilder().setURL(bannerURL)
        );
      container.addMediaGalleryComponents(gallery);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Download Banner")
          .setStyle(ButtonStyle.Link)
          .setURL(bannerURL)
      );

      container.addActionRowComponents(row);

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("ServerBannerCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while fetching the server banner.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      const { guild } = interaction;
      const bannerURL = guild.bannerURL({ dynamic: true, size: 4096 });

      if (!bannerURL) return interaction.reply({ content: `${emoji.get("cross")} This server doesn't have a banner!`, ephemeral: true });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.get("banner")} **${guild.name}'s Banner**`));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerURL)));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Download Banner").setStyle(ButtonStyle.Link).setURL(bannerURL)));

      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      await interaction.reply({ content: `${emoji.get("cross")} An error occurred.`, ephemeral: true });
    }
  }
}

export default new ServerBannerCommand();
