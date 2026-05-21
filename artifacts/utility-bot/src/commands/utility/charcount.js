import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "charcount",
  description: "Count the characters and words in text",
  usage: "charcount <text>",
  aliases: ["wordcount", "length", "strlen", "countchars"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "charcount",
    description: "Count characters and words in text",
    options: [{ name: "text", description: "Text to analyze", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Please provide some text!` });
    return message.reply({ embeds: [buildEmbed(args.join(" "))] });
  },

  async slashExecute({ client, interaction }) {
    const text = interaction.options.getString("text");
    return interaction.reply({ embeds: [buildEmbed(text)] });
  },
};

function buildEmbed(text) {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const lines = text.split("\n").length;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📊 Text Analysis")
    .addFields(
      { name: "Characters (with spaces)", value: chars.toString(), inline: true },
      { name: "Characters (no spaces)", value: charsNoSpace.toString(), inline: true },
      { name: "Words", value: words.toString(), inline: true },
      { name: "Sentences", value: sentences.toString(), inline: true },
      { name: "Lines", value: lines.toString(), inline: true },
    )
    .setDescription(`**Text:** ${text.slice(0, 200)}${text.length > 200 ? "..." : ""}`);
}
