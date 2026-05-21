import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const CHOICES = ["rock", "paper", "scissors"];
const EMOJIS = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

export default {
  name: "rps",
  description: "Play Rock, Paper, Scissors against the bot",
  usage: "rps <rock|paper|scissors>",
  aliases: ["rockpaperscissors"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "rps",
    description: "Play Rock Paper Scissors",
    options: [{ name: "choice", description: "Your choice", type: 3, required: true, choices: [{ name: "Rock 🪨", value: "rock" }, { name: "Paper 📄", value: "paper" }, { name: "Scissors ✂️", value: "scissors" }] }],
  },

  async execute({ client, message, args }) {
    const choice = args[0]?.toLowerCase();
    if (!CHOICES.includes(choice)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Choose `rock`, `paper`, or `scissors`.")] });
    const botChoice = CHOICES[Math.floor(Math.random() * 3)];
    return message.reply({ embeds: [buildEmbed(choice, botChoice, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const choice = interaction.options.getString("choice");
    const botChoice = CHOICES[Math.floor(Math.random() * 3)];
    return interaction.reply({ embeds: [buildEmbed(choice, botChoice, interaction.user)] });
  },
};

function buildEmbed(player, bot, user) {
  let result, color;
  if (player === bot) { result = "It's a tie!"; color = 0xffd700; }
  else if (BEATS[player] === bot) { result = "You win! 🎉"; color = 0x00ff00; }
  else { result = "I win! 😏"; color = 0xff0000; }
  return new EmbedBuilder().setColor(color).setTitle("✂️ Rock Paper Scissors")
    .setDescription(`${EMOJIS[player]} You chose **${player}**\n${EMOJIS[bot]} I chose **${bot}**\n\n**${result}**`)
    .setFooter({ text: `Played by ${user.tag}` });
}
