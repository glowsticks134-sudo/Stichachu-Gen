import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "clap",
  description: "Add 👏 between every word in your message",
  usage: "clap <text>",
  aliases: ["clapback"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "clap",
    description: "Add clap emoji between every word",
    options: [{ name: "text", description: "Your message", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Please provide some text!` });
    return message.reply({ content: args.join(" 👏 ") + " 👏" });
  },

  async slashExecute({ client, interaction }) {
    const text = interaction.options.getString("text");
    return interaction.reply({ content: text.split(" ").join(" 👏 ") + " 👏" });
  },
};
