import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const ROASTS = [
  "You're proof that even Wi-Fi has dead zones.",
  "I'd roast you further, but my mom said I'm not allowed to burn trash.",
  "You're like a cloud — when you disappear, it's a beautiful day.",
  "I'd call you a tool, but even tools are useful.",
  "You're the human version of a participation trophy.",
  "If brains were dynamite, you wouldn't have enough to blow your hat off.",
  "You're not stupid — you just have bad luck thinking.",
  "I'd agree with you, but then we'd both be wrong.",
  "You're the reason the gene pool needs a lifeguard.",
  "Light travels faster than sound. That's why you seemed bright until you started talking.",
  "You're not the dumbest person in the world, but you better hope they don't die.",
  "I've seen better heads on a cauliflower.",
  "If ignorance is bliss, you must be the happiest person alive.",
  "You're so dull, you can't even cut through butter.",
  "Out of 10 million sperm... you were the fastest?",
  "You're like a software update — when I see you, I want to hit 'Not Now'.",
];

export default {
  name: "roast",
  description: "Roast a user with a savage one-liner",
  usage: "roast [@user]",
  aliases: ["burn", "savage"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "roast",
    description: "Roast someone",
    options: [{ name: "user", description: "Who to roast (default: random)", type: 6, required: false }],
  },

  async execute({ client, message, args }) {
    const target = message.mentions.users.first() || message.author;
    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xff4500).setTitle(`${emoji.get("fire")} Roasted!`).setDescription(`${target}, ${roast}`).setFooter({ text: `Requested by ${message.author.tag}` })] });
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getUser("user") || interaction.user;
    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff4500).setTitle(`${emoji.get("fire")} Roasted!`).setDescription(`${target}, ${roast}`).setFooter({ text: `Requested by ${interaction.user.tag}` })] });
  },
};
