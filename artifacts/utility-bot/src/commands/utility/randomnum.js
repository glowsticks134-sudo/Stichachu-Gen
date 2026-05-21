import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "randomnum",
  description: "Generate a random number between two values",
  usage: "randomnum <min> <max>",
  aliases: ["rand", "rng", "randomnumber"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "randomnum",
    description: "Generate a random number between two values",
    options: [
      { name: "min", description: "Minimum value", type: 4, required: true },
      { name: "max", description: "Maximum value", type: 4, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const min = parseInt(args[0]);
    const max = parseInt(args[1]);
    if (isNaN(min) || isNaN(max)) return message.reply({ content: `${emoji.get("cross")} Usage: \`${this.usage}\`` });
    if (min >= max) return message.reply({ content: `${emoji.get("cross")} Min must be less than max!` });
    return message.reply({ embeds: [buildEmbed(min, max)] });
  },

  async slashExecute({ client, interaction }) {
    const min = interaction.options.getInteger("min");
    const max = interaction.options.getInteger("max");
    if (min >= max) return interaction.reply({ content: `${emoji.get("cross")} Min must be less than max!`, ephemeral: true });
    return interaction.reply({ embeds: [buildEmbed(min, max)] });
  },
};

function buildEmbed(min, max) {
  const result = Math.floor(Math.random() * (max - min + 1)) + min;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎲 Random Number")
    .setDescription(`**Range:** ${min} – ${max}\n**Result:** **${result}**`)
    .setTimestamp();
}
