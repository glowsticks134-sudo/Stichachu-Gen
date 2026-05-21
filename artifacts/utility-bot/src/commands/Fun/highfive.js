import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const highfiveGifs = [
  "https://media.tenor.com/O8YKWbR1wDEAAAAC/high-five-anime.gif",
  "https://media.tenor.com/a63Rk9vGSj0AAAAC/highfive-high-five.gif",
  "https://media.tenor.com/8Ci-jPLMoZoAAAAC/high-five.gif",
];

export default {
  name: "highfive",
  description: "High five someone",
  usage: "highfive <@user>",
  aliases: ["hi5", "hifive"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "highfive",
    description: "High five someone",
    options: [{ name: "user", description: "User to high five", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to high five!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = highfiveGifs[Math.floor(Math.random() * highfiveGifs.length)];
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("🙏 High Five!")
    .setDescription(`**${author.username}** high-fived **${target.username}**! ✋`)
    .setImage(gif);
}
