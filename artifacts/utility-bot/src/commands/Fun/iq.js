import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const levels = [
  { min: 0, max: 69, label: "Absolute Potato 🥔", color: 0xff0000 },
  { min: 70, max: 84, label: "Below Average 😬", color: 0xff6600 },
  { min: 85, max: 99, label: "Average 😐", color: 0xffd700 },
  { min: 100, max: 114, label: "Above Average 🙂", color: 0x57f287 },
  { min: 115, max: 129, label: "Smart 🧐", color: 0x00aaff },
  { min: 130, max: 144, label: "Very Smart 🎓", color: 0x5865f2 },
  { min: 145, max: 160, label: "Genius 🧠", color: 0xff73fa },
  { min: 161, max: 200, label: "Galaxy-Brained 🌌", color: 0xffffff },
];

export default {
  name: "iq",
  description: "Check someone's (random) IQ",
  usage: "iq [@user]",
  aliases: ["brains", "intelligence"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "iq",
    description: "Check someone's IQ (for fun)",
    options: [{ name: "user", description: "User to check (defaults to you)", type: 6, required: false }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.users.first() || message.author;
    return message.reply({ embeds: [buildEmbed(target)] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user") || interaction.user;
    return interaction.reply({ embeds: [buildEmbed(target)] });
  },
};

function buildEmbed(user) {
  const iq = Math.floor(Math.random() * 201);
  const level = levels.find(l => iq >= l.min && iq <= l.max) || levels[0];
  const bar = `[${"█".repeat(Math.round(iq / 20))}${"░".repeat(10 - Math.round(iq / 20))}]`;
  return new EmbedBuilder()
    .setColor(level.color)
    .setTitle("🧠 IQ Test Results")
    .setDescription(
      `**User:** ${user.username}\n` +
      `**IQ Score:** ${iq}\n` +
      `${bar}\n` +
      `**Level:** ${level.label}`
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Results are completely random and for fun only!" });
}
