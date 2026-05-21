/**
 * /listmails — Show all active email addresses owned by the calling user.
 * Groups by domain, shows relative timestamps, and displays a quota bar.
 * No cooldown.
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasesByUser } from '../utils/database.js';
import { timeAgo } from '../utils/aliasGenerator.js';

const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '20', 10);

function progressBar(used, max, width = 10) {
  const filled = Math.round((used / max) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${used}/${max}`;
}

export const data = new SlashCommandBuilder()
  .setName('listmails')
  .setDescription('List all your email addresses');

export async function execute(interaction) {
  const userId = interaction.user.id;
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

  // Group by domain
  const byDomain = {};
  for (const row of aliases) {
    const domain = row.domain ?? row.alias_email.split('@')[1] ?? 'unknown';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(row);
  }

  const fields = Object.entries(byDomain).map(([domain, rows]) => ({
    name: `@${domain} (${rows.length})`,
    value: rows.map((r) => `\`${r.alias_email}\` · *${timeAgo(r.created_at)}*`).join('\n'),
    inline: false,
  }));

  const bar = progressBar(count, MAX_ALIASES);
  const quotaColor =
    count >= MAX_ALIASES ? Colors.Red : count / MAX_ALIASES >= 0.8 ? Colors.Yellow : 0x5865f2;

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(quotaColor)
        .setTitle('📬 Your Addresses')
        .addFields(fields)
        .addFields({ name: 'Quota', value: bar, inline: false })
        .setFooter({ text: 'Use /delete to remove an address • Only you can see this' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
