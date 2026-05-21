import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import emoji from "#config/emoji";

const QUESTIONS = [
  { q: "What is the capital of Japan?", options: ["Beijing", "Seoul", "Tokyo", "Bangkok"], correct: 2 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
  { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Picasso"], correct: 2 },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2 },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correct: 1 },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
  { q: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Twain", "Austen"], correct: 1 },
  { q: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2 },
  { q: "What is the fastest land animal?", options: ["Lion", "Horse", "Cheetah", "Greyhound"], correct: 2 },
  { q: "What programming language is Discord.js written in?", options: ["Python", "Ruby", "Java", "JavaScript"], correct: 3 },
  { q: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correct: 2 },
  { q: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Quartz"], correct: 2 },
  { q: "Which country invented pizza?", options: ["USA", "France", "Italy", "Greece"], correct: 2 },
  { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correct: 1 },
  { q: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Page", "Hybrid Text Transfer Process", "Home Tool Transfer Port"], correct: 0 },
];

export default {
  name: "trivia",
  description: "Answer a random trivia question",
  usage: "trivia",
  aliases: ["quiz", "q"],
  category: "Fun",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "trivia", description: "Play a trivia question" },

  async execute({ client, message }) {
    return sendTrivia(message.channel, message.author);
  },

  async slashExecute({ client, interaction }) {
    await interaction.reply({ content: "Loading trivia..." });
    await interaction.deleteReply().catch(() => {});
    return sendTrivia(interaction.channel, interaction.user);
  },
};

async function sendTrivia(channel, user) {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const emojis = ["🇦", "🇧", "🇨", "🇩"];
  const row = new ActionRowBuilder().addComponents(
    q.options.map((opt, i) =>
      new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(`${emojis[i]} ${opt}`).setStyle(ButtonStyle.Secondary)
    )
  );
  const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("game")} Trivia`).setDescription(`**${q.q}**\n\nYou have 30 seconds!`).setFooter({ text: `Requested by ${user.tag}` });
  const msg = await channel.send({ embeds: [embed], components: [row] });
  const collector = msg.createMessageComponentCollector({ time: 30000 });
  const answered = new Set();
  const scores = { correct: 0, wrong: 0 };

  collector.on("collect", async i => {
    if (answered.has(i.user.id)) return i.reply({ content: "You already answered!", ephemeral: true });
    answered.add(i.user.id);
    const choice = parseInt(i.customId.split("_")[1]);
    if (choice === q.correct) {
      scores.correct++;
      await i.reply({ content: `✅ Correct, ${i.user}!`, ephemeral: true });
    } else {
      scores.wrong++;
      await i.reply({ content: `❌ Wrong, ${i.user}! The answer was **${q.options[q.correct]}**.`, ephemeral: true });
    }
  });

  collector.on("end", async () => {
    const revealEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${emoji.get("game")} Trivia — Time's Up!`)
      .setDescription(`**${q.q}**\n\n✅ **Answer:** ${q.options[q.correct]}\n\n**${scores.correct}** correct | **${scores.wrong}** wrong | **${answered.size}** total answers`);
    await msg.edit({ embeds: [revealEmbed], components: [] }).catch(() => {});
  });
}
