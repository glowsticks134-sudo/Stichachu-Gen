import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "emojis",
  description: "List all custom emojis in the server",
  usage: "emojis",
  aliases: ["emojilist", "serveremojis", "emotes"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "emojis", description: "List all custom emojis in this server" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: buildEmbeds(message.guild) });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: buildEmbeds(interaction.guild) });
  },
};

function buildEmbeds(guild) {
  const all = guild.emojis.cache;
  if (!all.size) {
    return [new EmbedBuilder().setColor(0x000000).setTitle("No Emojis").setDescription("This server has no custom emojis.")];
  }
  const static_ = all.filter(e => !e.animated);
  const animated = all.filter(e => e.animated);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${emoji.get("star")} Server Emojis — ${guild.name}`)
    .setDescription(
      `**Total:** ${all.size} | **Static:** ${static_.size} | **Animated:** ${animated.size}\n\n` +
      all.map(e => `${e} \`${e.name}\``).slice(0, 30).join("  ") +
      (all.size > 30 ? `\n*...and ${all.size - 30} more*` : "")
    )
    .setTimestamp();
  return [embed];
}
