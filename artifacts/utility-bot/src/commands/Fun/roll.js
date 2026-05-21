import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "roll",
  description: "Roll one or more dice (e.g. 2d6, d20, 4d10)",
  usage: "roll [NdS] (default: 1d6)",
  aliases: ["dice", "d", "diceroll"],
  category: "Fun",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "roll",
    description: "Roll dice",
    options: [{ name: "dice", description: "Dice notation (e.g. 2d6, d20)", type: 3, required: false }],
  },

  async execute({ client, message, args }) {
    const notation = args[0] || "1d6";
    return message.reply({ embeds: [buildRollEmbed(notation, message.author)] });
  },

  async slashExecute({ client, interaction }) {
    const notation = interaction.options.getString("dice") || "1d6";
    return interaction.reply({ embeds: [buildRollEmbed(notation, interaction.user)] });
  },
};

function buildRollEmbed(notation, user) {
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)$/);
  if (!match) return new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid dice notation. Use `NdS` format (e.g. `2d6`, `d20`).");
  const count = parseInt(match[1] || "1");
  const sides = parseInt(match[2]);
  if (count < 1 || count > 25 || sides < 2 || sides > 1000) return new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please use 1-25 dice with 2-1000 sides.");
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  const desc = count === 1 ? `Result: **${total}**` : `Rolls: **${rolls.join(", ")}**\n\nTotal: **${total}** / ${count * sides}\nAverage: **${(total / count).toFixed(1)}**`;
  return new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("dice")} Dice Roll — ${notation}`).setDescription(desc).setFooter({ text: `Rolled by ${user.tag}` });
}
