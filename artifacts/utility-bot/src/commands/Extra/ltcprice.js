import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

class LtcPriceCommand extends Command {
  constructor() {
    super({
      name: "ltcprice",
      description: "Convert letters to different text styles",
      usage: "ltcprice <style> <text>",
      aliases: ["letterconvert", "textconvert", "fancy", "ltc"],
      category: "Extra",
      examples: [
        "ltcprice bold Hello World",
        "ltcprice italic Hello World",
        "ltcprice monospace Code",
      ],
      cooldown: 5,
    });
  }

  async execute({ client, message, args }) {
    try {
      const styles = ["bold", "italic", "bolditalic", "monospace", "strikethrough", "underline", "smallcaps", "subscript", "superscript"];

      if (!args[0] || !styles.includes(args[0].toLowerCase())) {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("ltc")} **Letter Convert Styles**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Available styles:**\n` +
            `├─ \`bold\` - **Bold text**\n` +
            `├─ \`italic\` - *Italic text*\n` +
            `├─ \`bolditalic\` - ***Bold italic***\n` +
            `├─ \`monospace\` - \`Monospace text\`\n` +
            `├─ \`strikethrough\` - ~~Strikethrough~~\n` +
            `├─ \`underline\` - __Underline__\n` +
            `├─ \`smallcaps\` - ꜱᴍᴀʟʟ ᴄᴀᴘꜱ\n` +
            `├─ \`subscript\` - ₛᵤᵦₛᶜᵣᵢₚₜ\n` +
            `└─ \`superscript\` - ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗ\n\n` +
            `**Usage:** \`${this.usage}\``
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const style = args[0].toLowerCase();
      const text = args.slice(1).join(" ");

      if (!text) {
        return message.reply({
          content: `${emoji.get("cross")} Please provide text to convert!`,
        });
      }

      let convertedText = "";

      switch (style) {
        case "bold":
          convertedText = `**${text}**`;
          break;
        case "italic":
          convertedText = `*${text}*`;
          break;
        case "bolditalic":
          convertedText = `***${text}***`;
          break;
        case "monospace":
          convertedText = `\`${text}\``;
          break;
        case "strikethrough":
          convertedText = `~~${text}~~`;
          break;
        case "underline":
          convertedText = `__${text}__`;
          break;
        case "smallcaps":
          convertedText = this._toSmallCaps(text);
          break;
        case "subscript":
          convertedText = this._toSubscript(text);
          break;
        case "superscript":
          convertedText = this._toSuperscript(text);
          break;
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("ltc")} **Text Converted**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Style:** ${style}\n**Original:** ${text}\n**Converted:** ${convertedText}`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("LtcPriceCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }

  _toSmallCaps(text) {
    const smallCaps = {
      a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
      j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "q", r: "ʀ",
      s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
    };
    return text.toLowerCase().split("").map((c) => smallCaps[c] || c).join("");
  }

  _toSubscript(text) {
    const subscript = {
      a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ",
      o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
      "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
      "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    };
    return text.toLowerCase().split("").map((c) => subscript[c] || c).join("");
  }

  _toSuperscript(text) {
    const superscript = {
      a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ",
      j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ",
      t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
      "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
      "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    };
    return text.toLowerCase().split("").map((c) => superscript[c] || c).join("");
  }
}

export default new LtcPriceCommand();
