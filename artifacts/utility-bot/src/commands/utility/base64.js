import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "base64",
  description: "Encode or decode text in Base64",
  usage: "base64 <encode|decode> <text>",
  aliases: ["b64", "encode64"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "base64",
    description: "Encode or decode Base64 text",
    options: [
      { name: "action", description: "encode or decode", type: 3, required: true, choices: [{ name: "encode", value: "encode" }, { name: "decode", value: "decode" }] },
      { name: "text", description: "Text to encode or decode", type: 3, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const action = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!action || !text) return message.reply({ embeds: [errEmbed(this.usage)] });
    return message.reply({ embeds: [buildEmbed(action, text)] });
  },

  async slashExecute({ client, interaction }) {
    const action = interaction.options.getString("action");
    const text = interaction.options.getString("text");
    return interaction.reply({ embeds: [buildEmbed(action, text)] });
  },
};

function errEmbed(usage) {
  return new EmbedBuilder().setColor(0x000000).setTitle("❌ Usage").setDescription(`\`${usage}\``);
}

function buildEmbed(action, text) {
  let result;
  try {
    if (action === "encode") result = Buffer.from(text, "utf-8").toString("base64");
    else if (action === "decode") result = Buffer.from(text, "base64").toString("utf-8");
    else return errEmbed("base64 <encode|decode> <text>");
  } catch {
    return new EmbedBuilder().setColor(0xff0000).setTitle("❌ Error").setDescription("Failed to process. Make sure your Base64 text is valid.");
  }
  const label = action === "encode" ? "🔒 Encoded" : "🔓 Decoded";
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${label} (Base64)`)
    .addFields(
      { name: "Input", value: `\`\`\`${text.slice(0, 500)}\`\`\`` },
      { name: "Output", value: `\`\`\`${result.slice(0, 500)}\`\`\`` }
    )
    .setTimestamp();
}
