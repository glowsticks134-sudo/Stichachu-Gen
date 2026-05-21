import { EmbedBuilder } from "discord.js";
import { randomUUID } from "crypto";
import emoji from "#config/emoji";

export default {
  name: "uuid",
  description: "Generate a random UUID (v4)",
  usage: "uuid [count]",
  aliases: ["guid", "generateid"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "uuid",
    description: "Generate random UUID(s)",
    options: [{ name: "count", description: "How many UUIDs to generate (1-10)", type: 4, required: false, min_value: 1, max_value: 10 }],
  },

  async execute({ client, message, args }) {
    const count = Math.min(10, Math.max(1, parseInt(args[0]) || 1));
    return message.reply({ embeds: [buildEmbed(count)] });
  },

  async slashExecute({ client, interaction }) {
    const count = interaction.options.getInteger("count") || 1;
    return interaction.reply({ embeds: [buildEmbed(count)] });
  },
};

function buildEmbed(count) {
  const ids = Array.from({ length: count }, () => randomUUID());
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🔖 Generated UUID(s)")
    .setDescription(ids.map(id => `\`${id}\``).join("\n"))
    .setFooter({ text: `Generated ${count} UUID v4` });
}
