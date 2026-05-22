import { Command } from '#structures/classes/Command';
import {
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getLevelFromXp } from '#db/Levels';

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

class LeaderboardCommand extends Command {
  constructor() {
    super({
      name: 'leaderboard',
      description: 'View the server XP leaderboard',
      usage: 'leaderboard',
      aliases: ['lb', 'top', 'levels', 'ranking'],
      category: 'utility',
      examples: ['leaderboard'],
      cooldown: 10,
      enabledSlash: true,
      slashData: {
        name: 'leaderboard',
        description: 'View the server XP leaderboard',
      },
    });
  }

  async execute({ client, message }) {
    const msg = await message.reply({ content: '⏳ Loading leaderboard...' });
    await this._send({ ctx: msg, client, guild: message.guild, userId: message.author.id, isSlash: false });
  }

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    await this._send({ ctx: interaction, client, guild: interaction.guild, userId: interaction.user.id, isSlash: true });
  }

  async _send({ ctx, client, guild, userId, isSlash }) {
    const { db } = client;
    const total = db?.levels?.getTotalUsers(guild.id) ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    let page = 0;

    const buildEmbed = async (p) => {
      const rows = db?.levels?.getLeaderboard(guild.id, PAGE_SIZE, p * PAGE_SIZE) ?? [];

      const lines = await Promise.all(
        rows.map(async (row, i) => {
          const pos = p * PAGE_SIZE + i + 1;
          const prefix = MEDALS[pos - 1] ?? `**${pos}.**`;
          const level = getLevelFromXp(row.xp);
          let name;
          try {
            const member = await guild.members.fetch(row.user_id);
            name = member.user.username;
          } catch {
            name = `<@${row.user_id}>`;
          }
          return `${prefix} **${name}** — Level **${level}** (${row.xp.toLocaleString()} XP)`;
        }),
      );

      return new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(`🏆 ${guild.name} Leaderboard`)
        .setDescription(lines.length ? lines.join('\n') : 'No one has earned XP yet. Start chatting!')
        .setFooter({ text: `Page ${p + 1}/${totalPages} · ${total} members ranked` })
        .setTimestamp();
    };

    const buildRow = (p) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('lb_prev')
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(p === 0),
        new ButtonBuilder()
          .setCustomId('lb_next')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(p >= totalPages - 1),
      );

    const embed = await buildEmbed(page);
    const components = totalPages > 1 ? [buildRow(page)] : [];

    let msg;
    if (isSlash) {
      msg = await ctx.editReply({ embeds: [embed], components });
    } else {
      msg = await ctx.edit({ content: null, embeds: [embed], components });
    }

    if (totalPages <= 1) return;

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      time: 120_000,
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'lb_prev') page = Math.max(0, page - 1);
      if (i.customId === 'lb_next') page = Math.min(totalPages - 1, page + 1);
      const newEmbed = await buildEmbed(page);
      await i.update({ embeds: [newEmbed], components: [buildRow(page)] });
    });

    collector.on('end', () => {
      const edit = isSlash ? ctx.editReply.bind(ctx) : msg.edit.bind(msg);
      edit({ components: [] }).catch(() => {});
    });
  }
}

export default new LeaderboardCommand();
