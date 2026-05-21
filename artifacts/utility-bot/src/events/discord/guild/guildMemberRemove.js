import { db } from "#database/DatabaseManager";
import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";

function formatMessage(template, member) {
  return template
    .replace(/{user}/g, member.user.tag)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{membercount}/g, member.guild.memberCount);
}

export default {
  name: "guildMemberRemove",
  async execute(member, client) {
    if (member.user.bot) return;

    const guildId = member.guild.id;

    // ─── Goodbye Message ────────────────────────────────────────────────────────
    try {
      const goodbye = db.getGoodbye(guildId);
      if (goodbye.channel && goodbye.message) {
        const channel = member.guild.channels.cache.get(goodbye.channel);
        if (channel) {
          const text = formatMessage(goodbye.message, member);
          const embed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle(`👋 Goodbye!`)
            .setDescription(text)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();
          await channel.send({ embeds: [embed] }).catch(e => logger.warn("Goodbye", e.message));
        }
      }
    } catch (e) {
      logger.error("Goodbye", e.message);
    }

    // ─── Join Log (leave portion) ──────────────────────────────────────────────
    try {
      const joinlogId = db.getJoinlog(guildId);
      if (joinlogId) {
        const channel = member.guild.channels.cache.get(joinlogId);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("📤 Member Left")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
              `**User:** ${member.user.tag} (${member.id})\n` +
              `**Joined:** ${member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown"}\n` +
              `**Member Count:** ${member.guild.memberCount}`
            )
            .setTimestamp();
          await channel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    } catch (e) {
      logger.error("JoinLog", e.message);
    }

    // ─── Invite Tracking ───────────────────────────────────────────────────────
    try {
      const memberData = db.invites.getMemberInvites(guildId, member.id);
      if (memberData && memberData.inviter_id) {
        db.invites.incrementLeft(guildId, memberData.inviter_id, 1);
      }
    } catch (error) {
      logger.error("InviteTracker", `Error handling member leave: ${error.message}`);
    }
  },
};
