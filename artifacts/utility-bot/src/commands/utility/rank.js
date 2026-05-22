import { Command } from '#structures/classes/Command';
import { EmbedBuilder, Colors } from 'discord.js';
import { getLevelFromXp, xpForNextLevel, totalXpForLevel } from '#db/Levels';

function xpBar(current, required, width = 14) {
  const filled = Math.min(width, Math.round((current / required) * width));
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${current.toLocaleString()} / ${required.toLocaleString()} XP`;
}

class RankCommand extends Command {
  constructor() {
    super({
      name: 'rank',
      description: "View a user's level and XP rank",
      usage: 'rank [@user]',
      aliases: ['level', 'xp', 'lvl'],
      category: 'utility',
      examples: ['rank', 'rank @user'],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: 'rank',
        description: "View your or another user's XP rank",
        options: [
          {
            name: 'user',
            description: 'The user to check (defaults to you)',
            type: 6,
            required: false,
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    const target =
      message.mentions.members.first() ||
      (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) ||
      message.member;

    const embed = await this._buildEmbed(client, target?.user ?? message.author, message.guild.id);
    return message.reply({ embeds: [embed] });
  }

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user') ?? interaction.user;
    const embed = await this._buildEmbed(client, target, interaction.guild.id);
    return interaction.editReply({ embeds: [embed] });
  }

  async _buildEmbed(client, user, guildId) {
    const { db } = client;
    const data = db?.levels?.getUser(user.id, guildId);
    const xp = data?.xp ?? 0;
    const level = getLevelFromXp(xp);
    const levelStartXp = totalXpForLevel(level);
    const xpNeeded = xpForNextLevel(level);
    const xpIntoLevel = xp - levelStartXp;
    const rank = db?.levels?.getRank(user.id, guildId) ?? '?';

    return new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setAuthor({
        name: user.displayName ?? user.username,
        iconURL: user.displayAvatarURL({ size: 64 }),
      })
      .addFields(
        { name: '🏆 Server Rank', value: `#${rank}`, inline: true },
        { name: '⭐ Level', value: `${level}`, inline: true },
        { name: '✨ Total XP', value: xp.toLocaleString(), inline: true },
        { name: '📊 Progress to Next Level', value: xpBar(xpIntoLevel, xpNeeded), inline: false },
      )
      .setFooter({ text: `${(xpNeeded - xpIntoLevel).toLocaleString()} XP until Level ${level + 1}` })
      .setTimestamp();
  }
}

export default new RankCommand();
