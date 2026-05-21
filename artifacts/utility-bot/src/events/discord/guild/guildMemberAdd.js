import { db } from "#database/DatabaseManager";
import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";

function formatMessage(template, member) {
  return template
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{membercount}/g, member.guild.memberCount);
}

export default {
  name: "guildMemberAdd",
  async execute(member, client) {
    if (member.user.bot) return;

    const guildId = member.guild.id;

    // ─── Autorole ──────────────────────────────────────────────────────────────
    try {
      const autoroleId = db.getAutorole(guildId);
      if (autoroleId) {
        const role = member.guild.roles.cache.get(autoroleId);
        if (role) await member.roles.add(role).catch(e => logger.warn("Autorole", `Failed: ${e.message}`));
      }
    } catch (e) {
      logger.error("Autorole", e.message);
    }

    // ─── Welcome Message ────────────────────────────────────────────────────────
    try {
      const welcome = db.getWelcome(guildId);
      if (welcome.channel && welcome.message) {
        const channel = member.guild.channels.cache.get(welcome.channel);
        if (channel) {
          const text = formatMessage(welcome.message, member);
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`👋 Welcome to ${member.guild.name}!`)
            .setDescription(text)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();
          await channel.send({ embeds: [embed] }).catch(e => logger.warn("Welcome", e.message));
        }
      }
    } catch (e) {
      logger.error("Welcome", e.message);
    }

    // ─── Join Log ──────────────────────────────────────────────────────────────
    try {
      const joinlogId = db.getJoinlog(guildId);
      if (joinlogId) {
        const channel = member.guild.channels.cache.get(joinlogId);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("📥 Member Joined")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
              `**User:** ${member.user.tag} (${member.id})\n` +
              `**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n` +
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
    if (!db.isInviteTrackingEnabled(guildId)) return;

    try {
      const oldInvites = client.inviteCache?.get(guildId) || new Map();
      const newInvites = await member.guild.invites.fetch({ cache: false });

      let usedInvite = null;
      let inviter = null;

      for (const [code, invite] of newInvites) {
        const oldInvite = oldInvites.get(code);
        if (oldInvite && invite.uses > oldInvite.uses) {
          usedInvite = invite;
          inviter = invite.inviter;
          break;
        }
      }

      if (!usedInvite) {
        for (const [code, invite] of newInvites) {
          if (!oldInvites.has(code) && invite.uses > 0) {
            usedInvite = invite;
            inviter = invite.inviter;
            break;
          }
        }
      }

      const cacheMap = new Map();
      for (const [code, invite] of newInvites) {
        cacheMap.set(code, { uses: invite.uses, inviterId: invite.inviter?.id });
      }
      if (!client.inviteCache) client.inviteCache = new Map();
      client.inviteCache.set(guildId, cacheMap);

      if (inviter && inviter.id !== member.id) {
        const memberCreatedAt = member.user.createdTimestamp;
        const accountAge = Date.now() - memberCreatedAt;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        db.invites.incrementTracked(guildId, inviter.id, 1);

        if (accountAge < sevenDays) {
          db.invites.incrementFake(guildId, inviter.id, 1);
          logger.debug("InviteTracker", `Fake invite detected for ${member.user.tag}`);
        }

        db.invites.setInviterData(guildId, member.id, inviter.id, usedInvite.code);
        logger.debug("InviteTracker", `${member.user.tag} invited by ${inviter.tag}`);

        const inviterData = db.invites.getMemberInvites(guildId, inviter.id);
        const effectiveInvites = db.invites.getEffectiveInvites(inviterData);
        const eligibleRanks = db.invites.getEligibleRanks(guildId, effectiveInvites);

        if (eligibleRanks.length > 0) {
          const inviterMember = await member.guild.members.fetch(inviter.id).catch(() => null);
          if (inviterMember) {
            for (const rank of eligibleRanks) {
              const role = member.guild.roles.cache.get(rank.role_id);
              if (role && !inviterMember.roles.cache.has(role.id)) {
                await inviterMember.roles.add(role).catch(() => null);
              }
            }
          }
        }
      } else {
        db.invites.ensureMember(guildId, member.id);
      }
    } catch (error) {
      logger.error("InviteTracker", `Error: ${error.message}`);
    }
  },
};
