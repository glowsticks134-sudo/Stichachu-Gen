import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const COMPLIMENTS = [
  "You light up every room you walk into.",
  "You have an incredible ability to make people feel heard.",
  "Your kindness is genuinely inspiring.",
  "You're one of the most creative people I've ever come across.",
  "You make the world a better place just by being in it.",
  "The way you carry yourself is truly admirable.",
  "You have a talent for making difficult things look easy.",
  "Your positive energy is absolutely infectious.",
  "You're the kind of person that makes others want to be better.",
  "You have an amazing sense of humor — the right kind.",
  "Your dedication and work ethic are truly something special.",
  "You bring out the best in the people around you.",
  "You're brilliant and you probably don't even realize it.",
  "The world needs more people like you.",
  "You're genuinely one of a kind.",
];

export default {
  name: "compliment",
  description: "Give someone a heartfelt compliment",
  usage: "compliment [@user]",
  aliases: ["praise", "flatter"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "compliment",
    description: "Give someone a compliment",
    options: [{ name: "user", description: "Who to compliment", type: 6, required: false }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.users.first() || message.author;
    const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xff69b4).setTitle(`${emoji.get("heart")} Compliment!`).setDescription(`${target}, ${compliment}`).setFooter({ text: `From ${message.author.tag} with love` })] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user") || interaction.user;
    const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff69b4).setTitle(`${emoji.get("heart")} Compliment!`).setDescription(`${target}, ${compliment}`).setFooter({ text: `From ${interaction.user.tag} with love` })] });
  },
};
