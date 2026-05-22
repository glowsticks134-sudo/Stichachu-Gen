/**
 * /listmails — Show all active email addresses owned by the calling user.
 * Groups by domain, shows relative timestamps, quota bar, and paginated
 * navigation buttons when the user has more than PAGE_SIZE addresses.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAliasesByUser } from '../utils/database.js';
import { timeAgo } from '../utils/aliasGenerator.js';

const MAX_ALIASES = parseInt(process.env.MAX_ALIASES_PER_USER ?? '20', 10);
const PAGE_SIZE = 8;

function progressBar(used, max, width = 10) {
  const filled = Math.round((used / max) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${used}/${max}`;
}

function buildEmbed(aliases, page, totalPages, totalCount) {
  const start = page * PAGE_SIZE;
  const slice = aliases.slice(start, start + PAGE_SIZE);

  const byDomain = {};
  for (const row of slice) {
    const domain = row.domain ?? row.alias_email.split('@')[1] ?? 'unknown';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(row);
  }

  const fields = Object.entries(byDomain).map(([domain, rows]) => ({
    name: `@${domain} (${rows.length})`,
    value: rows.map((r) => `\`${r.alias_email}\` · *${timeAgo(r.created_at)}*`).join('\n'),
    inline: false,
  }));

  const bar = progressBar(totalCount, MAX_ALIASES);
  const quotaColor =
    totalCount >= MAX_ALIASES ? Colors.Red : totalCount / MAX_ALIASES >= 0.8 ? Colors.Yellow : 0x5865f2;

  return new EmbedBuilder()
    .setColor(quotaColor)
    .setTitle('📬 Your Addresses')
    .addFields(fields)
    .addFields({ name: 'Quota', value: bar, inline: false })
    .setFooter({
      text: `${totalPages > 1 ? `Page ${page + 1}/${totalPages} · ` : ''}Use /delete to remove · Only you can see this`,
    })
    .setTimestamp();
}

function buildRow(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('list_prev')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('list_next')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1),
  );
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

  const totalPages = Math.ceil(count / PAGE_SIZE);
  let page = 0;

  await interaction.reply({
    embeds: [buildEmbed(aliases, page, totalPages, count)],
    components: totalPages > 1 ? [buildRow(page, totalPages)] : [],
    ephemeral: true,
  });

  if (totalPages <= 1) return;

  const reply = await interaction.fetchReply();
  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === userId,
    time: 120_000,
  });

  collector.on('collect', async (i) => {
    if (i.customId === 'list_prev') page = Math.max(0, page - 1);
    if (i.customId === 'list_next') page = Math.min(totalPages - 1, page + 1);
    await i.update({
      embeds: [buildEmbed(aliases, page, totalPages, count)],
      components: [buildRow(page, totalPages)],
    });
  });

  collector.on('end', () => {
    interaction.editReply({ components: [] }).catch(() => {});
  });
}
