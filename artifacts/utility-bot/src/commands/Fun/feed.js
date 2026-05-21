import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const foods = ["a sandwich", "some pizza", "a cupcake", "ramen noodles", "ice cream", "tacos", "sushi", "a burger", "cookies", "a piece of cake", "some fries", "a hotdog", "donuts", "waffles", "a bowl of cereal"];

export default {
  name: "feed",
  description: "Feed someone some food",
  usage: "feed <@user>",
  aliases: ["give", "nom"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "feed",
    description: "Feed someone some food",
    options: [{ name: "user", description: "User to feed", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to feed!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const food = foods[Math.floor(Math.random() * foods.length)];
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("🍽️ Nom Nom!")
    .setDescription(`**${author.username}** fed **${target.username}** ${food}! 😋`)
    .setFooter({ text: "Sharing is caring!" });
}
