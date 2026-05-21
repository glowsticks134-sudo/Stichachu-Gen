import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const bonkGifs = [
  "https://media.tenor.com/vt79Ce0oXXoAAAAC/bonk-anime.gif",
  "https://media.tenor.com/H50KrCVqH2sAAAAC/anime-bonk.gif",
  "https://media.tenor.com/O2CXVEtSp5QAAAAC/bonk.gif",
  "https://media.tenor.com/hhPQhWGcUkYAAAAC/bonk-hit.gif",
];

export default {
  name: "bonk",
  description: "Bonk someone on the head",
  usage: "bonk <@user>",
  aliases: ["bop", "whack"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "bonk",
    description: "Bonk someone on the head",
    options: [{ name: "user", description: "User to bonk", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to bonk!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = bonkGifs[Math.floor(Math.random() * bonkGifs.length)];
  return new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle("🔨 BONK!")
    .setDescription(`**${author.username}** bonked **${target.username}**! Go to horny jail! 🚓`)
    .setImage(gif);
}
