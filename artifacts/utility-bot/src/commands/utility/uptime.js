import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "uptime",
  description: "Shows how long the bot has been online",
  usage: "uptime",
  aliases: ["online", "botuptime"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "uptime", description: "Show how long the bot has been running" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed(client)] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed(client)] });
  },
};

function msToHuman(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function buildEmbed(client) {
  const uptime = client.uptime ?? 0;
  const startedAt = Date.now() - uptime;
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`${emoji.get("check")} Bot Uptime`)
    .setDescription(
      `**Online since:** <t:${Math.floor(startedAt / 1000)}:R>\n` +
      `**Uptime:** ${msToHuman(uptime)}`
    )
    .setTimestamp();
}
