import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "coinflip",
  description: "Flip a coin — heads or tails!",
  usage: "coinflip [heads|tails]",
  aliases: ["flip", "coin"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "coinflip",
    description: "Flip a coin",
    options: [{ name: "guess", description: "Your guess: heads or tails", type: 3, required: false, choices: [{ name: "heads", value: "heads" }, { name: "tails", value: "tails" }] }],
  },

  async execute({ client, message, args }) {
    const guess = args[0]?.toLowerCase();
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = guess ? guess === result : null;
    return message.reply({ embeds: [buildEmbed(result, guess, won, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const guess = interaction.options.getString("guess");
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = guess ? guess === result : null;
    return interaction.reply({ embeds: [buildEmbed(result, guess, won, interaction.user)] });
  },
};

function buildEmbed(result, guess, won, user) {
  const coin = result === "heads" ? "🪙" : "🌀";
  let desc = `${coin} The coin landed on **${result.toUpperCase()}**!`;
  if (guess !== null && won !== null) desc += won ? `\n\n✅ You guessed **${guess}** — you were right!` : `\n\n❌ You guessed **${guess}** — better luck next time!`;
  return new EmbedBuilder().setColor(won ? 0x00ff00 : won === false ? 0xff0000 : 0xffd700).setTitle("🪙 Coin Flip").setDescription(desc).setFooter({ text: `Flipped by ${user.tag}` });
}
