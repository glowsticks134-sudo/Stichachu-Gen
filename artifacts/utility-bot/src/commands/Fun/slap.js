import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const slapGifs = [
  "https://media.tenor.com/8vmE4Sj-1XUAAAAC/anime-slap.gif",
  "https://media.tenor.com/JFWHqmdQiIEAAAAC/slap-anime.gif",
  "https://media.tenor.com/c36UPSHtCcgAAAAC/anime-slap.gif",
  "https://media.tenor.com/5WalLbJBY7wAAAAC/slap-anime-slap.gif",
];

export default {
  name: "slap",
  description: "Slap someone",
  usage: "slap <@user>",
  aliases: ["smack", "hit"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "slap",
    description: "Slap someone",
    options: [{ name: "user", description: "User to slap", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to slap!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
  return new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle("👋 Slap!")
    .setDescription(`**${author.username}** slapped **${target.username}**! That's gotta hurt!`)
    .setImage(gif);
}
