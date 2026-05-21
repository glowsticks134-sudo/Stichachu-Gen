import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "stickers",
  description: "List all stickers in the server",
  usage: "stickers",
  aliases: ["stickerlist", "serverstickers"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "stickers", description: "List all server stickers" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed(message.guild)] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed(interaction.guild)] });
  },
};

function buildEmbed(guild) {
  const stickers = guild.stickers.cache;
  if (!stickers.size) {
    return new EmbedBuilder().setColor(0x000000).setTitle("No Stickers").setDescription("This server has no custom stickers.");
  }
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎭 Server Stickers — ${guild.name}`)
    .setDescription(stickers.map(s => `**${s.name}** — \`${s.id}\`\n${s.description ? `*${s.description}*` : ""}`).slice(0, 20).join("\n"))
    .setFooter({ text: `${stickers.size} total stickers` })
    .setTimestamp();
}
