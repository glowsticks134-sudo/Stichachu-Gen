import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const pokeGifs = [
  "https://media.tenor.com/oFTuOB2DXZUAAAAC/anime-poke.gif",
  "https://media.tenor.com/Oq2iZAX9TpoAAAAC/poke-anime.gif",
  "https://media.tenor.com/9cSFb37hNlcAAAAC/poke-anime.gif",
];

const pokeTexts = [
  "**{author}** poked **{target}**! *poke poke*",
  "**{author}** keeps poking **{target}**...",
  "**{author}** poked **{target}** in the side!",
  "**{author}** gave **{target}** an annoying poke!",
];

export default {
  name: "poke",
  description: "Poke someone",
  usage: "poke <@user>",
  aliases: ["prod"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "poke",
    description: "Poke someone",
    options: [{ name: "user", description: "User to poke", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to poke!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const gif = pokeGifs[Math.floor(Math.random() * pokeGifs.length)];
  const text = pokeTexts[Math.floor(Math.random() * pokeTexts.length)]
    .replace("{author}", author.username)
    .replace("{target}", target.username);
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("👉 Poke!")
    .setDescription(text)
    .setImage(gif);
}
