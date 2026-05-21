/**
 * /stats — Show live bot statistics.
 *
 * Visible to everyone. Shows:
 *  - Total active addresses and all-time count
 *  - Unique users
 *  - Addresses created in the last 24 hours
 *  - Top domains by usage
 *  - Bot uptime
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStats } from '../utils/database.js';
import { botStartTime } from '../utils/clientStore.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';

const COOLDOWN_SECS = 15;

/** Format milliseconds into a human-readable uptime string. */
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
  const userId = interaction.user.id;

  const { onCooldown, remainingSecs } = checkCooldown('stats', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      content: `⏳ Wait **${remainingSecs}s** before checking stats again.`,
      ephemeral: true,
    });
  }
  setCooldown('stats', userId);

  const { totalActive, totalAllTime, uniqueUsers, byDomain, last24h } = getStats();

  // Build top-domains field
  const domainLines =
    byDomain.length > 0
      ? byDomain.map((r, i) => `${i + 1}. @${r.domain ?? 'unknown'} — **${r.n}**`).join('\n')
      : 'No data yet';

  const uptime = botStartTime
    ? formatUptime(Date.now() - botStartTime)
    : 'Unknown';

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📊 Bot Statistics')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
          {
            name: '📧 Active Addresses',
            value: `**${totalActive}** (${totalAllTime} all-time)`,
            inline: true,
          },
          {
            name: '👥 Unique Users',
            value: `**${uniqueUsers}**`,
            inline: true,
          },
          {
            name: '🕐 Last 24 Hours',
            value: `**${last24h}** new ${last24h === 1 ? 'address' : 'addresses'}`,
            inline: true,
          },
          {
            name: '🏆 Top Domains',
            value: domainLines,
            inline: false,
          },
          {
            name: '⏱️ Uptime',
            value: uptime,
            inline: true,
          },
        )
        .setFooter({ text: `${interaction.client.user.username} • Live data` })
        .setTimestamp(),
    ],
  });
}
