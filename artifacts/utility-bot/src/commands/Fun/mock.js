import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "mock",
  description: "Convert text to SpOnGeBoB MoCkInG format",
  usage: "mock <text>",
  aliases: ["spongebob", "mocking"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "mock",
    description: "Convert text to SpOnGeBoB mocking format",
    options: [{ name: "text", description: "Text to mock", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Please provide some text to mock!` });
    const text = args.join(" ");
    return message.reply({ embeds: [buildEmbed(text, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const text = interaction.options.getString("text");
    return interaction.reply({ embeds: [buildEmbed(text, interaction.user)] });
  },
};

function mockText(str) {
  return str.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

function buildEmbed(text, user) {
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🧽 SpOnGeBoB MoCk")
    .setDescription(`**Original:** ${text}\n**Mocked:** ${mockText(text)}`)
    .setFooter({ text: `Requested by ${user.username}` });
}
