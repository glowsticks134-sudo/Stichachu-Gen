import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const waveTexts = [
  "**{author}** waves at **{target}**! 👋",
  "**{author}** enthusiastically waves at **{target}**!",
  "**{author}** gives **{target}** a friendly wave!",
  "**{author}** waves hello to **{target}**!",
];

export default {
  name: "wave",
  description: "Wave at someone",
  usage: "wave <@user>",
  aliases: ["hello", "greet"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "wave",
    description: "Wave at someone",
    options: [{ name: "user", description: "User to wave at", type: 6, required: true }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${emoji.get("cross")} Please mention someone to wave at!` });
    return message.reply({ embeds: [buildEmbed(message.author, target.user)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    return interaction.reply({ embeds: [buildEmbed(interaction.user, target.user)] });
  },
};

function buildEmbed(author, target) {
  const text = waveTexts[Math.floor(Math.random() * waveTexts.length)]
    .replace("{author}", author.username).replace("{target}", target.username);
  return new EmbedBuilder().setColor(0x57f287).setTitle("👋 Wave!").setDescription(text);
}
