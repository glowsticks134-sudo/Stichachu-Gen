import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const fortunes = [
  "Good luck and good fortune are ahead of you.",
  "An unexpected event will bring you good luck soon.",
  "Something wonderful is about to happen.",
  "Be prepared for a change that will bring you joy.",
  "Your hard work will soon pay off.",
  "A pleasant surprise awaits you.",
  "The stars align in your favor today.",
  "Creativity and imagination will lead you to success.",
  "A loyal friend is worth a thousand relatives.",
  "Your efforts will be rewarded beyond your expectations.",
  "Soon you will be sitting on top of the world.",
  "You are talented in many ways.",
  "A dream you have will come true.",
  "Keep your eyes open — opportunity is closer than you think.",
  "Today is a lucky day for those who remain positive.",
  "Failure is the stepping stone to success.",
  "Someone is admiring you from a distance.",
  "Your principles mean more to you than any money or success.",
  "A pleasant surprise is waiting for you.",
  "Curiosity is the key to creativity.",
  "All progress takes place outside the comfort zone.",
  "The secret ingredient is always love.",
  "Your kindness will come back to you threefold.",
  "Today is the first day of the rest of your life.",
  "Every path leads somewhere — choose the one that excites you.",
];

export default {
  name: "fortune",
  description: "Get your fortune cookie fortune",
  usage: "fortune",
  aliases: ["cookie", "fortunecookie", "lucky"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "fortune", description: "Get a fortune cookie fortune" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed(message.author)] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed(interaction.user)] });
  },
};

function buildEmbed(user) {
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🥠 Fortune Cookie")
    .setDescription(`*"${fortune}"*`)
    .setFooter({ text: `Fortune for ${user.username}` })
    .setTimestamp();
}
