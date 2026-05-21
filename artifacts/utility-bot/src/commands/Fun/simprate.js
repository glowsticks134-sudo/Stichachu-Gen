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

class SimpRateCommand extends Command {
  constructor() {
    super({
      name: "simprate",
      description: "Check the simp meter (just for fun!)",
      usage: "simprate [@user]",
      aliases: ["simp", "simpmeter", "howsimp"],
      category: "Fun",
      examples: ["simprate", "simprate @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "simprate",
        description: "Check someone's simp rate",
        options: [{ name: "user", description: "Target user", type: 6, required: false }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first() || message.member;
      const simpPercent = Math.floor(Math.random() * 101);

      let simpLevel;
      let simpEmoji;
      if (simpPercent <= 20) {
        simpLevel = "Not a Simp";
        simpEmoji = emoji.get("check");
      } else if (simpPercent <= 40) {
        simpLevel = "Slightly Simping";
        simpEmoji = emoji.get("info");
      } else if (simpPercent <= 60) {
        simpLevel = "Moderate Simp";
        simpEmoji = emoji.get("heart");
      } else if (simpPercent <= 80) {
        simpLevel = "Major Simp";
        simpEmoji = emoji.get("fire");
      } else {
        simpLevel = "ULTRA SIMP LORD";
        simpEmoji = emoji.get("star");
      }

      const progressBar = this._createProgressBar(simpPercent);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("heart")} **Simp-O-Meter**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const content = 
        `**Target:** ${target.user.username}\n\n` +
        `**Simp Level:** ${simpPercent}%\n` +
        `${progressBar}\n\n` +
        `**Rating:** ${simpEmoji} ${simpLevel}`;

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
      client.logger?.error("SimpRateCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user") || interaction.member;
    const pct = Math.floor(Math.random() * 101);
    const bar = this._createProgressBar(pct);
    await interaction.reply({ content: `💘 **${target.user.username}** is **${pct}% simp**\n${bar}`, ephemeral: false });
  }

  _createProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }
}

export default new SimpRateCommand();
