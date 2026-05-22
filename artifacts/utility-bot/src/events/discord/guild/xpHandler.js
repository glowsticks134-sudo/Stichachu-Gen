/**
 * XP Handler — awards XP for every message, respects a per-user cooldown,
 * and announces level-ups in the channel where the message was sent.
 */

import { EmbedBuilder, Colors } from 'discord.js';
import { getLevelFromXp, xpForNextLevel, totalXpForLevel } from '#db/Levels';

const XP_MIN = 15;
const XP_MAX = 25;
const XP_COOLDOWN = 60_000; // 1 minute between XP gains

export default {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content || message.content.trim().length < 1) return;

    const { db } = client;
    if (!db?.levels) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    if (!db.levels.canEarnXp(userId, guildId, XP_COOLDOWN)) return;

    const xpEarned = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
    const updated = db.levels.addXp(userId, guildId, xpEarned);

    const newLevel = getLevelFromXp(updated.xp);
    const oldLevel = updated.level;

    if (newLevel > oldLevel) {
      db.levels.setLevel(userId, guildId, newLevel);

      const xpNeeded = xpForNextLevel(newLevel);
      const xpStart = totalXpForLevel(newLevel);

      try {
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Gold)
              .setDescription(
                `🎉 GG <@${userId}>! You leveled up to **Level ${newLevel}**!\n` +
                `Next level in **${xpNeeded.toLocaleString()} XP**.`,
              )
              .setFooter({ text: 'Keep chatting to earn more XP' }),
          ],
        });
      } catch {
        // Channel may not be sendable — skip silently
      }
    }
  },
};
