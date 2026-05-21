import { db } from "#database/DatabaseManager";
import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";

function formatMessage(template, member) {
  return template
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name);
}

export default {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember, client) {
    if (newMember.user.bot) return;

    const guildId = newMember.guild.id;

    // ─── Boost Message ─────────────────────────────────────────────────────────
    try {
      const wasBoosting = !!oldMember.premiumSince;
      const isBoosting = !!newMember.premiumSince;

      if (!wasBoosting && isBoosting) {
        const boost = db.getBoost(guildId);
        if (boost.channel && boost.message) {
          const channel = newMember.guild.channels.cache.get(boost.channel);
          if (channel) {
            const text = formatMessage(boost.message, newMember);
            const embed = new EmbedBuilder()
              .setColor(0xff73fa)
              .setTitle("🚀 New Server Boost!")
              .setDescription(text)
              .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
              .setFooter({ text: `Boost Level: ${newMember.guild.premiumTier}` })
              .setTimestamp();
            await channel.send({ embeds: [embed] }).catch(e => logger.warn("BoostMsg", e.message));
          }
        }
      }
    } catch (e) {
      logger.error("BoostMsg", e.message);
    }
  },
};
