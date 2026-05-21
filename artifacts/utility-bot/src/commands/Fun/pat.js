import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const patGifs = [
  "https://media.tenor.com/UtNuJQqXZqkAAAAC/anime-pat.gif",
  "https://media.tenor.com/0jWB4YGSj2YAAAAC/anime-head-pat.gif",
  "https://media.tenor.com/1bFALPKxcfgAAAAC/headpat-anime.gif",
  "https://media.tenor.com/CrMoNHIb0WkAAAAC/head-pat-anime.gif",
];

export default {
  name: "pat",
  description: "Pat someone on the head",
  usage: "pat <@user>",
  aliases: ["headpat", "pets"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "pat",
    description: "Pat someone on the head",
    options: [{ name: "user", description: "User to pat", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to pat!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = patGifs[Math.floor(Math.random() * patGifs.length)];
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("✋ Head Pat!")
    .setDescription(`**${author.username}** pats **${target.username}** on the head! ☺️`)
    .setImage(gif);
}
