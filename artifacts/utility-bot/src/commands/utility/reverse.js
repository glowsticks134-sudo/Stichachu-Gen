import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "reverse",
  description: "Reverse text",
  usage: "reverse <text>",
  aliases: ["backwards", "flip"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "reverse",
    description: "Reverse some text",
    options: [{ name: "text", description: "Text to reverse", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Please provide some text!` });
    const text = args.join(" ");
    return message.reply({ embeds: [buildEmbed(text)] });
  },

  async slashExecute({ client, interaction }) {
    const text = interaction.options.getString("text");
    return interaction.reply({ embeds: [buildEmbed(text)] });
  },
};

function buildEmbed(text) {
  const reversed = text.split("").reverse().join("");
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🔄 Reversed Text")
    .addFields(
      { name: "Original", value: text.slice(0, 500) },
      { name: "Reversed", value: reversed.slice(0, 500) }
    );
}
