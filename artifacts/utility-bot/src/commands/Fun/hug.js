import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const hugGifs = [
  "https://media.tenor.com/AVJK8-0_7DkAAAAC/anime-hug.gif",
  "https://media.tenor.com/od_DMgB-aFwAAAAC/hug-anime.gif",
  "https://media.tenor.com/Ep6QS1ZrJlsAAAAC/hug-anime-hug.gif",
  "https://media.tenor.com/3Bg0c5-8cDMAAAAC/hug-anime.gif",
  "https://media.tenor.com/TDwgpd5DRNUAAAAC/hug.gif",
];

export default {
  name: "hug",
  description: "Hug someone",
  usage: "hug <@user>",
  aliases: ["cuddle"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "hug",
    description: "Hug someone",
    options: [{ name: "user", description: "User to hug", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to hug!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
  return new EmbedBuilder()
    .setColor(0xff73fa)
    .setTitle("🤗 Hug!")
    .setDescription(`**${author.username}** hugs **${target.username}**! How wholesome!`)
    .setImage(gif)
    .setFooter({ text: "Spread love, not hate 💕" });
}
