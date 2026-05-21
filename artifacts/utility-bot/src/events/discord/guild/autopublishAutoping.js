import { db } from "#database/DatabaseManager";
import { ChannelType } from "discord.js";
import { logger } from "#utils/logger";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;

    // ─── Auto-Publish (Announcement Channels) ─────────────────────────────────
    try {
      if (message.channel.type === ChannelType.GuildAnnouncement) {
        if (db.isAutopublish(guildId, message.channel.id)) {
          await message.crosspost().catch(e => {
            if (e.code !== 40033) logger.warn("AutoPublish", e.message);
          });
        }
      }
    } catch (e) {
      logger.error("AutoPublish", e.message);
    }

    // ─── Auto-Ping ─────────────────────────────────────────────────────────────
    try {
      const autoping = db.getAutoping(guildId, message.channel.id);
      if (autoping) {
        const role = message.guild.roles.cache.get(autoping.role_id);
        if (role) {
          const pingMsg = await message.channel.send({ content: role.toString(), allowedMentions: { roles: [role.id] } });
          setTimeout(() => pingMsg.delete().catch(() => {}), 3000);
        }
      }
    } catch (e) {
      logger.error("AutoPing", e.message);
    }

    // ─── Counting ──────────────────────────────────────────────────────────────
    try {
      const counting = db.getCounting(guildId);
      if (counting && counting.channel_id === message.channel.id) {
        const num = parseInt(message.content.trim());
        const expected = (counting.current_count || 0) + 1;
        if (isNaN(num) || num !== expected || counting.last_user_id === message.author.id) {
          await message.delete().catch(() => {});
          if (counting.last_user_id === message.author.id) {
            await message.channel.send(`❌ **${message.author.username}**, you can't count twice in a row! Count resets to **0**.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
          } else {
            await message.channel.send(`❌ **${message.author.username}** ruined it! The next number was **${expected}**. Count resets to **0**.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
          }
          db.settings.updateCount(guildId, 0, null);
        } else {
          db.settings.updateCount(guildId, num, message.author.id);
          if (num % 100 === 0) {
            await message.react("🎉").catch(() => {});
          } else {
            await message.react("✅").catch(() => {});
          }
        }
      }
    } catch (e) {
      logger.error("Counting", e.message);
    }
  },
};
