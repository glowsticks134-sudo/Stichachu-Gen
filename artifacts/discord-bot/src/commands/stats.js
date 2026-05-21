/**
 * /stats — Show live bot statistics. No cooldown.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStats } from '../utils/database.js';
import { botStartTime } from '../utils/clientStore.js';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Show bot statistics');

export async function execute(interaction) {
  const { totalActive, totalAllTime, uniqueUsers, byDomain, last24h } = getStats();

  const domainLines =
    byDomain.length > 0
      ? byDomain.map((r, i) => `${i + 1}. @${r.domain ?? 'unknown'} — **${r.n}**`).join('\n')
      : 'No data yet';

  const uptime = botStartTime ? formatUptime(Date.now() - botStartTime) : 'Unknown';

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📊 Bot Statistics')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
          { name: '📧 Active Addresses', value: `**${totalActive}** (${totalAllTime} all-time)`, inline: true },
          { name: '👥 Unique Users', value: `**${uniqueUsers}**`, inline: true },
          { name: '🕐 Last 24 Hours', value: `**${last24h}** new`, inline: true },
          { name: '🏆 Top Domains', value: domainLines, inline: false },
          { name: '⏱️ Uptime', value: uptime, inline: true },
        )
        .setFooter({ text: `${interaction.client.user.username} • Live data` })
        .setTimestamp(),
    ],
  });
}
