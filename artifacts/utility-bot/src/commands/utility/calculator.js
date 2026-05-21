import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "calculator",
  description: "Evaluate a math expression",
  usage: "calculator <expression>",
  aliases: ["calc", "math", "compute"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "calculator",
    description: "Calculate a math expression",
    options: [{ name: "expression", description: "Math expression (e.g. 5 * (3 + 2))", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    const expr = args.join(" ");
    if (!expr) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    return message.reply({ embeds: [buildCalcEmbed(expr)] });
  },

  async slashExecute({ client, interaction }) {
    const expr = interaction.options.getString("expression");
    return interaction.reply({ embeds: [buildCalcEmbed(expr)] });
  },
};

function safeEval(expr) {
  const sanitized = expr.replace(/[^0-9+\-*/().\s%^]/g, "");
  if (sanitized !== expr.replace(/\s/g, "").replace(/[^0-9+\-*/().\s%^]/g, "")) {
    throw new Error("Invalid characters in expression");
  }
  const normalized = sanitized
    .replace(/\^/g, "**")
    .replace(/(\d+)%/g, "($1/100)");
  const result = Function(`"use strict"; return (${normalized})`)();
  if (!isFinite(result)) throw new Error("Result is not finite");
  return result;
}

function buildCalcEmbed(expr) {
  try {
    const result = safeEval(expr);
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🧮 Calculator`)
      .setDescription(`**Expression:**\n\`\`\`${expr}\`\`\`\n**Result:**\n\`\`\`${result}\`\`\``)
      .setTimestamp();
  } catch (err) {
    return new EmbedBuilder()
      .setColor(0x000000)
      .setTitle(`${emoji.get("cross")} Calculation Error`)
      .setDescription(`Could not evaluate: \`${expr}\`\n\nMake sure you use valid math operators: \`+\`, \`-\`, \`*\`, \`/\`, \`(\`, \`)\`, \`^\`, \`%\``);
  }
}
