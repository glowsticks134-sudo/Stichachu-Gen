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

class ServerIconCommand extends Command {
  constructor() {
    super({
      name: "servericon",
      description: "Display the server's icon",
      usage: "servericon",
      aliases: ["sicon", "guildicon", "serverav"],
      category: "utility",
      examples: ["servericon"],
      cooldown: 5,
      enabledSlash: true,
      slashData: { name: "servericon", description: "Display the server's icon" },
    });
  }

  async execute({ client, message, args }) {
    try {
      const { guild } = message;

      const iconURL = guild.iconURL({ dynamic: true, size: 4096 });

      if (!iconURL) {
        return message.reply({
          content: `${emoji.get("cross")} This server doesn't have an icon!`,
        });
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("icon")} **${guild.name}'s Icon**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const gallery = new MediaGalleryBuilder()
        .addItems(
          new MediaGalleryItemBuilder().setURL(iconURL)
        );
      container.addMediaGalleryComponents(gallery);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Download Icon")
          .setStyle(ButtonStyle.Link)
          .setURL(iconURL)
      );

      container.addActionRowComponents(row);

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("ServerIconCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while fetching the server icon.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      const { guild } = interaction;
      const iconURL = guild.iconURL({ dynamic: true, size: 4096 });

      if (!iconURL) return interaction.reply({ content: `${emoji.get("cross")} This server doesn't have an icon!`, ephemeral: true });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.get("icon")} **${guild.name}'s Icon**`));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(iconURL)));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Download Icon").setStyle(ButtonStyle.Link).setURL(iconURL)));

      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      await interaction.reply({ content: `${emoji.get("cross")} An error occurred.`, ephemeral: true });
    }
  }
}

export default new ServerIconCommand();
