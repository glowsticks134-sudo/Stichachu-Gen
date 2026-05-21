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

class HowDumbCommand extends Command {
  constructor() {
    super({
      name: "howdumb",
      description: "Check how dumb someone is (just for fun!)",
      usage: "howdumb [@user]",
      aliases: ["dumb", "stupidrate", "iqtest"],
      category: "Fun",
      examples: ["howdumb", "howdumb @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "howdumb",
        description: "Check how dumb someone is",
        options: [{ name: "user", description: "Target user", type: 6, required: false }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first() || message.member;
      const dumbPercent = Math.floor(Math.random() * 101);

      let dumbLevel;
      let dumbEmoji;
      if (dumbPercent <= 20) {
        dumbLevel = "Genius Level IQ";
        dumbEmoji = emoji.get("star");
      } else if (dumbPercent <= 40) {
        dumbLevel = "Pretty Smart";
        dumbEmoji = emoji.get("check");
      } else if (dumbPercent <= 60) {
        dumbLevel = "Average Intelligence";
        dumbEmoji = emoji.get("info");
      } else if (dumbPercent <= 80) {
        dumbLevel = "A Bit Slow";
        dumbEmoji = emoji.get("cross");
      } else {
        dumbLevel = "Certified Dummy";
        dumbEmoji = emoji.get("skull");
      }

      const progressBar = this._createProgressBar(dumbPercent);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("game")} **Dumb-O-Meter**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const content = 
        `**Target:** ${target.user.username}\n\n` +
        `**Dumb Level:** ${dumbPercent}%\n` +
        `${progressBar}\n\n` +
        `**Rating:** ${dumbEmoji} ${dumbLevel}`;

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
      client.logger?.error("HowDumbCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user") || interaction.member;
    const pct = Math.floor(Math.random() * 101);
    const bar = this._createProgressBar(pct);
    await interaction.reply({ content: `🧠 **${target.user.username}** is **${pct}% dumb**\n${bar}`, ephemeral: false });
  }

  _createProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }
}

export default new HowDumbCommand();
