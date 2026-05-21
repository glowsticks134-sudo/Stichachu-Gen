import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "choose",
  description: "Let the bot choose between multiple options",
  usage: "choose <option1 | option2 | option3>",
  aliases: ["pick", "decide", "random"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "choose",
    description: "Let the bot randomly pick between options",
    options: [{ name: "options", description: "Pipe-separated choices (e.g. pizza | tacos | sushi)", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Provide options separated by \`|\`. E.g: \`choose pizza | tacos | sushi\`` });
    const options = args.join(" ").split("|").map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return message.reply({ content: `${emoji.get("cross")} Please give at least 2 options separated by \`|\`.` });
    return message.reply({ embeds: [buildEmbed(options, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const raw = interaction.options.getString("options");
    const options = raw.split("|").map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return interaction.reply({ content: `${emoji.get("cross")} Please give at least 2 options separated by \`|\`.`, ephemeral: true });
    return interaction.reply({ embeds: [buildEmbed(options, interaction.user)] });
  },
};

function buildEmbed(options, user) {
  const chosen = options[Math.floor(Math.random() * options.length)];
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎲 Decision Made!")
    .setDescription(`**Options given:**\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n**I choose:** **${chosen}**`)
    .setFooter({ text: `Requested by ${user.username}` });
}
