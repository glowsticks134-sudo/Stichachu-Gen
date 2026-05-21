import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const facts = [
  "A day on Venus is longer than a year on Venus.",
  "Honey never expires. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "The average person walks the equivalent of five times around the Earth in a lifetime.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "The longest word in the English language takes over three hours to pronounce.",
  "A group of flamingos is called a 'flamboyance'.",
  "The fingerprints of koalas are virtually indistinguishable from those of humans.",
  "Crows can recognize and remember human faces.",
  "There are more possible iterations of a game of chess than there are atoms in the known universe.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Mars is 24 hours, 39 minutes, and 35 seconds.",
  "The average cloud weighs 1.1 million pounds.",
  "Wombats produce cube-shaped poop.",
  "The shortest war in history lasted 38–45 minutes (Anglo-Zanzibar War, 1896).",
  "Hot water can freeze faster than cold water under certain conditions (Mpemba effect).",
  "There's a species of jellyfish that is considered biologically immortal.",
  "The human body contains enough fat to make 7 bars of soap.",
  "Sloths can hold their breath for up to 40 minutes.",
  "A shrimp's heart is in its head.",
  "Elephants are the only animals that can't jump.",
  "An ostrich's eye is bigger than its brain.",
  "Ants never sleep and don't have lungs.",
  "There are more stars in the universe than grains of sand on Earth.",
  "The smell of freshly cut grass is actually a distress signal from the grass.",
  "You cannot hum while holding your nose closed.",
];

export default {
  name: "fact",
  description: "Get a random interesting fact",
  usage: "fact",
  aliases: ["facts", "randomfact", "didyouknow"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "fact", description: "Get a random interesting fact" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed()] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed()] });
  },
};

function buildEmbed() {
  const fact = facts[Math.floor(Math.random() * facts.length)];
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🧠 Random Fact")
    .setDescription(`💡 **Did you know?**\n\n${fact}`)
    .setTimestamp();
}
