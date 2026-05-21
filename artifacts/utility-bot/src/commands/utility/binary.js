import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "binary",
  description: "Convert text to binary or binary to text",
  usage: "binary <encode|decode> <text>",
  aliases: ["bin"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "binary",
    description: "Convert text to/from binary",
    options: [
      { name: "action", description: "encode or decode", type: 3, required: true, choices: [{ name: "encode", value: "encode" }, { name: "decode", value: "decode" }] },
      { name: "text", description: "Text to convert", type: 3, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const action = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!action || !text) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle("❌ Usage").setDescription(`\`${this.usage}\``)] });
    return message.reply({ embeds: [buildEmbed(action, text)] });
  },

  async slashExecute({ client, interaction }) {
    const action = interaction.options.getString("action");
    const text = interaction.options.getString("text");
    return interaction.reply({ embeds: [buildEmbed(action, text)] });
  },
};

function buildEmbed(action, text) {
  let result;
  try {
    if (action === "encode") {
      result = text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    } else {
      result = text.trim().split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("");
    }
  } catch {
    return new EmbedBuilder().setColor(0xff0000).setTitle("❌ Error").setDescription("Conversion failed. Check your input.");
  }
  const label = action === "encode" ? "🔢 Text → Binary" : "🔤 Binary → Text";
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(label)
    .addFields(
      { name: "Input", value: `\`\`\`${text.slice(0, 400)}\`\`\`` },
      { name: "Output", value: `\`\`\`${result.slice(0, 400)}\`\`\`` }
    )
    .setTimestamp();
}
