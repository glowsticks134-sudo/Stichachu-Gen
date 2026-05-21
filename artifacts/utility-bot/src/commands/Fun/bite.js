import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const biteTexts = [
  "**{author}** bit **{target}** like a feral goblin! 😈",
  "**{author}** chomped on **{target}**'s arm! OUCH!",
  "**{author}** playfully nibbled on **{target}**!",
  "**{author}** sank their teeth into **{target}**! Are they okay?!",
  "**{author}** bit **{target}** — somebody stop them!",
];

export default {
  name: "bite",
  description: "Bite someone",
  usage: "bite <@user>",
  aliases: ["chomp", "nibble"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "bite",
    description: "Bite someone",
    options: [{ name: "user", description: "User to bite", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to bite!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const text = biteTexts[Math.floor(Math.random() * biteTexts.length)]
    .replace("{author}", author.username).replace("{target}", target.username);
  return new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle("😬 Bite!")
    .setDescription(text)
    .setThumbnail(target.displayAvatarURL({ dynamic: true }));
}
