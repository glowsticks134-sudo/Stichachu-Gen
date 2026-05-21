import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const RESPONSES = [
  { answer: "It is certain.", type: "positive" },
  { answer: "It is decidedly so.", type: "positive" },
  { answer: "Without a doubt.", type: "positive" },
  { answer: "Yes, definitely.", type: "positive" },
  { answer: "You may rely on it.", type: "positive" },
  { answer: "As I see it, yes.", type: "positive" },
  { answer: "Most likely.", type: "positive" },
  { answer: "Outlook good.", type: "positive" },
  { answer: "Yes.", type: "positive" },
  { answer: "Signs point to yes.", type: "positive" },
  { answer: "Reply hazy, try again.", type: "neutral" },
  { answer: "Ask again later.", type: "neutral" },
  { answer: "Better not tell you now.", type: "neutral" },
  { answer: "Cannot predict now.", type: "neutral" },
  { answer: "Concentrate and ask again.", type: "neutral" },
  { answer: "Don't count on it.", type: "negative" },
  { answer: "My reply is no.", type: "negative" },
  { answer: "My sources say no.", type: "negative" },
  { answer: "Outlook not so good.", type: "negative" },
  { answer: "Very doubtful.", type: "negative" },
];

export default {
  name: "8ball",
  description: "Ask the magic 8-ball a yes/no question",
  usage: "8ball <question>",
  aliases: ["eightball", "8b"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "8ball",
    description: "Ask the magic 8-ball a question",
    options: [{ name: "question", description: "Your yes/no question", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please ask a question!")] });
    const question = args.join(" ");
    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    return message.reply({ embeds: [buildEmbed(question, response, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const question = interaction.options.getString("question");
    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    return interaction.reply({ embeds: [buildEmbed(question, response, interaction.user)] });
  },
};

function buildEmbed(question, response, user) {
  const colors = { positive: 0x00ff00, neutral: 0xffd700, negative: 0xff0000 };
  const emojis = { positive: "🟢", neutral: "🟡", negative: "🔴" };
  return new EmbedBuilder()
    .setColor(colors[response.type])
    .setTitle("🎱 Magic 8-Ball")
    .setDescription(`**Question:** ${question}\n\n${emojis[response.type]} **${response.answer}**`)
    .setFooter({ text: `Asked by ${user.tag}` });
}
