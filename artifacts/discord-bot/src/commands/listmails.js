/**
 * /listmails — Show all active email addresses owned by the calling user.
 *
 * Improvements:
 *  - Groups addresses by domain
 *  - Shows relative timestamps ("2 days ago") instead of raw dates
 *  - Displays a visual quota bar
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasesByUser, countActiveAliases } from '../utils/database.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';
import { timeAgo } from '../utils/aliasGenerator.js';

const COOLDOWN_SECS = 10;
const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '10', 10);

/** Build a simple text progress bar — e.g. [████░░░░░░] 4/10 */
function progressBar(used, max, width = 10) {
  const filled = Math.round((used / max) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${used}/${max}`;
}

export const data = new SlashCommandBuilder()
  .setName('listmails')
  .setDescription('List all your email addresses');

export async function execute(interaction) {
  const userId = interaction.user.id;

  const { onCooldown, remainingSecs } = checkCooldown('listmails', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(`⏳ Wait **${remainingSecs}s** before listing again.`),
      ],
      ephemeral: true,
    });
  }
  setCooldown('listmails', userId);

  const aliases = getAliasesByUser(userId);
  const count = aliases.length;

  if (count === 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('📭 No addresses yet')
          .setDescription('Use `/gen` to generate your first email address!')
          .setFooter({ text: 'Only you can see this' }),
      ],
      ephemeral: true,
    });
  }

  // Group by domain, newest first within each group
  const byDomain = {};
  for (const row of aliases) {
    const domain = row.domain ?? row.alias_email.split('@')[1] ?? 'unknown';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(row);
  }

  const fields = Object.entries(byDomain).map(([domain, rows]) => ({
    name: `@${domain} (${rows.length})`,
    value: rows
      .map((r) => `\`${r.alias_email}\` · *${timeAgo(r.created_at)}*`)
      .join('\n'),
    inline: false,
  }));

  // Quota bar
  const bar = progressBar(count, MAX_ALIASES);
  const quotaColor = count >= MAX_ALIASES ? Colors.Red : count / MAX_ALIASES >= 0.8 ? Colors.Yellow : 0x5865f2;

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(quotaColor)
        .setTitle(`📬 Your Addresses`)
        .addFields(fields)
        .addFields({ name: 'Quota', value: bar, inline: false })
        .setFooter({ text: 'Use /delete to remove an address • Only you can see this' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
