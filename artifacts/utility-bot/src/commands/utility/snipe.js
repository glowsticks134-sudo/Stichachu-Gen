import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

class SnipeCommand extends Command {
  constructor() {
    super({
      name: "snipe",
      description: "View the last deleted message in this channel",
      usage: "snipe",
      aliases: ["s"],
      category: "utility",
      examples: ["snipe"],
      cooldown: 5,
      enabledSlash: true,
      slashData: { name: "snipe", description: "View the last deleted message in this channel" },
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!client.snipes) {
        client.snipes = new Map();
      }

      const snipe = client.snipes.get(message.channel.id);

      if (!snipe) {
        return message.reply({
          content: `${emoji.get("cross")} There's nothing to snipe in this channel!`,
        });
      }

      const timeDiff = Date.now() - snipe.timestamp;
      if (timeDiff > 5 * 60 * 1000) {
        client.snipes.delete(message.channel.id);
        return message.reply({
          content: `${emoji.get("cross")} The sniped message has expired (older than 5 minutes).`,
        });
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("snipe")} **Sniped Message**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const content = 
        `**Author:** ${snipe.author.tag}\n` +
        `**Deleted:** <t:${Math.floor(snipe.timestamp / 1000)}:R>\n\n` +
        `**Content:**\n${snipe.content || "*No text content*"}`;

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            snipe.author.displayAvatarURL({ dynamic: true })
          )
        );

      container.addSectionComponents(section);

      if (snipe.attachments && snipe.attachments.length > 0) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        const imageAttachments = snipe.attachments.filter(a => 
          a.contentType?.startsWith("image/")
        );

        if (imageAttachments.length > 0) {
          const gallery = new MediaGalleryBuilder()
            .addItems(
              new MediaGalleryItemBuilder().setURL(imageAttachments[0].url)
            );
          container.addMediaGalleryComponents(gallery);
        } else {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Attachments:** ${snipe.attachments.length} file(s)`
            )
          );
        }
      }

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("SnipeCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while sniping.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      if (!client.snipes) client.snipes = new Map();
      const snipe = client.snipes.get(interaction.channel.id);

      if (!snipe) return interaction.reply({ content: `${emoji.get("cross")} Nothing to snipe!`, ephemeral: true });

      const timeDiff = Date.now() - snipe.timestamp;
      if (timeDiff > 5 * 60 * 1000) {
        client.snipes.delete(interaction.channel.id);
        return interaction.reply({ content: `${emoji.get("cross")} Sniped message expired (>5 min).`, ephemeral: true });
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.get("snipe")} **Sniped Message**`));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      const content = `**Author:** ${snipe.author.tag}\n**Deleted:** <t:${Math.floor(snipe.timestamp / 1000)}:R>\n\n**Content:**\n${snipe.content || "*No text content*"}`;
      const section = new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(content)).setThumbnailAccessory(new ThumbnailBuilder().setURL(snipe.author.displayAvatarURL({ dynamic: true })));
      container.addSectionComponents(section);

      if (snipe.attachments?.length > 0) {
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        const imageAttachments = snipe.attachments.filter(a => a.contentType?.startsWith("image/"));
        if (imageAttachments.length > 0) {
          container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageAttachments[0].url)));
        } else {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Attachments:** ${snipe.attachments.length} file(s)`));
        }
      }

      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      await interaction.reply({ content: `${emoji.get("cross")} An error occurred.`, ephemeral: true });
    }
  }
}

export default new SnipeCommand();
