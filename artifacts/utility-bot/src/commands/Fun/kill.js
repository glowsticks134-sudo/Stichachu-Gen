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

const killMessages = [
  "{killer} threw {victim} into a mass of zombies.",
  "{killer} pushed {victim} off a cliff.",
  "{killer} fed {victim} to the sharks.",
  "{killer} sent {victim} to the shadow realm.",
  "{killer} yeeted {victim} into the sun.",
  "{killer} used {victim} as target practice.",
  "{killer} dropped an anvil on {victim}.",
  "{killer} challenged {victim} to a duel and won.",
  "{killer} served {victim} to a hungry dragon.",
  "{killer} sent {victim} to Brazil.",
  "{killer} trapped {victim} in the backrooms.",
  "{killer} made {victim} step on a LEGO.",
  "{killer} told {victim} a joke so bad they died.",
  "{killer} deleted {victim}'s Minecraft world.",
  "{killer} cancelled {victim}'s Discord Nitro.",
  "{killer} unsubscribed {victim} from life.",
  "{killer} turned {victim} into a frog.",
  "{killer} sent {victim} to detention forever.",
  "{killer} used the Infinity Gauntlet on {victim}.",
  "{killer} hit {victim} with a blue shell.",
  "{killer} gave {victim} decaf instead of regular coffee.",
  "{killer} rickrolled {victim} to death.",
  "{killer} made {victim} watch a 10-hour loop of Baby Shark.",
  "{killer} showed {victim} their browser history.",
  "{killer} made {victim} eat pineapple pizza.",
];

class KillCommand extends Command {
  constructor() {
    super({
      name: "kill",
      description: "Virtually eliminate someone (just for fun!)",
      usage: "kill <@user>",
      aliases: ["eliminate", "destroy"],
      category: "Fun",
      examples: ["kill @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "kill",
        description: "Virtually eliminate someone (just for fun!)",
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
          content: `${emoji.get("cross")} Please mention someone to eliminate!\n**Usage:** \`${this.usage}\``,
        });
      }

      if (target.id === message.author.id) {
        return message.reply({
          content: `${emoji.get("cross")} You can't eliminate yourself! That's sad...`,
        });
      }

      const randomMessage = killMessages[Math.floor(Math.random() * killMessages.length)]
        .replace("{killer}", `**${message.author.username}**`)
        .replace("{victim}", `**${target.user.username}**`);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("skull")} **Elimination!**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(randomMessage)
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
          `*RIP ${target.user.username}. Press F to pay respects.*`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("KillCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "You can't kill yourself!", ephemeral: true });
    const randomMessage = killMessages[Math.floor(Math.random() * killMessages.length)]
      .replace("{killer}", `**${interaction.user.username}**`)
      .replace("{victim}", `**${target.user.username}**`);
    await interaction.reply({ content: `💀 ${randomMessage}\n\n*RIP ${target.user.username}. Press F to pay respects.*` });
  }
}

export default new KillCommand();
