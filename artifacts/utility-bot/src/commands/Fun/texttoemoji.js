import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

const emojiMap = {
  'a': ':regional_indicator_a:',
  'b': ':regional_indicator_b:',
  'c': ':regional_indicator_c:',
  'd': ':regional_indicator_d:',
  'e': ':regional_indicator_e:',
  'f': ':regional_indicator_f:',
  'g': ':regional_indicator_g:',
  'h': ':regional_indicator_h:',
  'i': ':regional_indicator_i:',
  'j': ':regional_indicator_j:',
  'k': ':regional_indicator_k:',
  'l': ':regional_indicator_l:',
  'm': ':regional_indicator_m:',
  'n': ':regional_indicator_n:',
  'o': ':regional_indicator_o:',
  'p': ':regional_indicator_p:',
  'q': ':regional_indicator_q:',
  'r': ':regional_indicator_r:',
  's': ':regional_indicator_s:',
  't': ':regional_indicator_t:',
  'u': ':regional_indicator_u:',
  'v': ':regional_indicator_v:',
  'w': ':regional_indicator_w:',
  'x': ':regional_indicator_x:',
  'y': ':regional_indicator_y:',
  'z': ':regional_indicator_z:',
  '0': ':zero:',
  '1': ':one:',
  '2': ':two:',
  '3': ':three:',
  '4': ':four:',
  '5': ':five:',
  '6': ':six:',
  '7': ':seven:',
  '8': ':eight:',
  '9': ':nine:',
  ' ': '   ',
  '!': ':exclamation:',
  '?': ':question:',
  '#': ':hash:',
  '*': ':asterisk:',
};

class TextToEmojiCommand extends Command {
  constructor() {
    super({
      name: "texttoemoji",
      description: "Convert text to emoji letters",
      usage: "texttoemoji <text>",
      aliases: ["tte", "emojify", "textmoji"],
      category: "Fun",
      examples: ["texttoemoji hello", "tte hi there"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "texttoemoji",
        description: "Convert text to emoji letters",
        options: [{ name: "text", description: "Text to convert (max 50 chars)", type: 3, required: true }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!args.length) {
        return message.reply({
          content: `${emoji.get("cross")} Please provide text to convert!\n**Usage:** \`${this.usage}\``,
        });
      }

      const text = args.join(" ").toLowerCase();
      
      if (text.length > 50) {
        return message.reply({
          content: `${emoji.get("cross")} Text is too long! Maximum 50 characters.`,
        });
      }

      let emojiText = "";
      for (const char of text) {
        if (emojiMap[char]) {
          emojiText += emojiMap[char] + " ";
        } else {
          emojiText += char + " ";
        }
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("sparkle")} **Text to Emoji**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Original:** ${text}\n\n**Emojified:**\n${emojiText.trim()}`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("TextToEmojiCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const text = interaction.options.getString("text").toLowerCase();
    if (text.length > 50) return interaction.reply({ content: `${emoji.get("cross")} Text is too long! Max 50 characters.`, ephemeral: true });
    let emojiText = "";
    for (const char of text) {
      emojiText += (emojiMap[char] || char) + " ";
    }
    await interaction.reply({ content: `**Original:** ${text}\n\n**Emojified:**\n${emojiText.trim()}` });
  }
}

export default new TextToEmojiCommand();
