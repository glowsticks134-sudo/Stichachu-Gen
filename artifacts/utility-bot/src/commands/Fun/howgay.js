import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

class HowGayCommand extends Command {
  constructor() {
    super({
      name: "howgay",
      description: "Check the gay meter (just for fun!)",
      usage: "howgay [@user]",
      aliases: ["gayrate", "gaymeter"],
      category: "Fun",
      examples: ["howgay", "howgay @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "howgay",
        description: "Check someone's gay rate",
        options: [{ name: "user", description: "Target user", type: 6, required: false }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first() || message.member;
      const gayPercent = Math.floor(Math.random() * 101);

      const progressBar = this._createProgressBar(gayPercent);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("game")} **Gay-O-Meter**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const content = 
        `**Target:** ${target.user.username}\n\n` +
        `**Gay Level:** ${gayPercent}%\n` +
        `${progressBar}`;

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            target.user.displayAvatarURL({ dynamic: true })
          )
        );

      container.addSectionComponents(section);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `*This is just for fun! Results are completely random.*`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("HowGayCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user") || interaction.member;
    const pct = Math.floor(Math.random() * 101);
    const bar = this._createProgressBar(pct);
    await interaction.reply({ content: `🌈 **${target.user.username}** is **${pct}% gay**\n${bar}`, ephemeral: false });
  }

  _createProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }
}

export default new HowGayCommand();
