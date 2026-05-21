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

const pickupLines = [
  "Are you a magician? Because whenever I look at you, everyone else disappears.",
  "Do you have a map? I just got lost in your eyes.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you a parking ticket? Because you've got 'fine' written all over you.",
  "Do you believe in love at first sight, or should I walk by again?",
  "Is your dad a boxer? Because you're a knockout!",
  "Are you a campfire? Because you're hot and I want s'more.",
  "Do you have a Band-Aid? Because I just scraped my knee falling for you.",
  "Is there an airport nearby, or is that just my heart taking off?",
  "Are you a bank loan? Because you've got my interest.",
  "Do you have a sunburn, or are you always this hot?",
  "Is your name Chapstick? Because you're da balm!",
  "Are you a time traveler? Because I can see you in my future.",
  "Do you have a mirror in your pocket? Because I can see myself in your pants.",
  "Is your dad a terrorist? Because you're the bomb!",
  "Are you a keyboard? Because you're just my type.",
  "Do you have a pencil? Because I want to erase your past and write our future.",
  "Is your name WiFi? Because I'm feeling a connection.",
  "Are you a cat? Because you're purrfect!",
  "Do you have a name, or can I call you mine?",
  "Is your dad a preacher? Because you're a blessing!",
  "Are you a snowstorm? Because you make my heart race.",
  "Do you have a library card? Because I'm checking you out.",
  "Is your name Ariel? Because I think we mermaid for each other.",
  "Are you a volcano? Because I lava you!",
  "Do you have a quarter? I want to call my mom and tell her I met the one.",
  "Is your dad a jewel thief? Because you're a real gem!",
  "Are you a camera? Because every time I look at you, I smile.",
  "Do you have a Bandaid? I just scraped my knee falling for you.",
  "Is your name Waldo? Because someone like you is hard to find.",
];

class PickupCommand extends Command {
  constructor() {
    super({
      name: "pickup",
      description: "Get a random pickup line",
      usage: "pickup [@user]",
      aliases: ["pickupline", "flirt", "rizz"],
      category: "Fun",
      examples: ["pickup", "pickup @user"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "pickup",
        description: "Get a random pickup line",
        options: [{ name: "user", description: "Target user to flirt with", type: 6, required: false }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first();
      const randomLine = pickupLines[Math.floor(Math.random() * pickupLines.length)];

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("heart")} **Pickup Line**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      let content;
      if (target) {
        content = `**${message.author.username}** says to **${target.user.username}**:\n\n*"${randomLine}"*`;
      } else {
        content = `**${message.author.username}** uses a pickup line:\n\n*"${randomLine}"*`;
      }

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            message.author.displayAvatarURL({ dynamic: true })
          )
        );

      container.addSectionComponents(section);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `*Smooth moves! Use wisely.*`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("PickupCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const line = pickupLines[Math.floor(Math.random() * pickupLines.length)];
    const content = target
      ? `**${interaction.user.username}** says to **${target.user.username}**:\n\n*"${line}"*`
      : `**${interaction.user.username}** uses a pickup line:\n\n*"${line}"*`;
    await interaction.reply({ content });
  }
}

export default new PickupCommand();
