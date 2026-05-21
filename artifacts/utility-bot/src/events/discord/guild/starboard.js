import { db } from "#database/DatabaseManager";
import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";

const starredMessages = new Set();

export default {
  name: "messageReactionAdd",
  async execute(reaction, user, client) {
    try {
      if (user.bot) return;
      if (reaction.emoji.name !== "⭐") return;

      if (reaction.partial) {
        await reaction.fetch().catch(() => null);
      }
      const message = reaction.message.partial
        ? await reaction.message.fetch().catch(() => null)
        : reaction.message;

      if (!message || !message.guild) return;

      const guildId = message.guild.id;
      const config = db.getStarboard(guildId);
      if (!config) return;

      const { channel_id, threshold } = config;
      const starCount = reaction.count || 0;
      if (starCount < (threshold || 3)) return;

      const msgKey = `${guildId}-${message.id}`;
      if (starredMessages.has(msgKey)) return;
      starredMessages.add(msgKey);

      const starChannel = message.guild.channels.cache.get(channel_id);
      if (!starChannel) return;

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(message.content || "*No text content*")
        .addFields(
          { name: "Source", value: `[Jump to message](${message.url})`, inline: true },
          { name: "Channel", value: `<#${message.channel.id}>`, inline: true }
        )
        .setTimestamp(message.createdAt)
        .setFooter({ text: `${starCount} ⭐` });

      if (message.attachments.size > 0) {
        const img = message.attachments.find(a => a.contentType?.startsWith("image/"));
        if (img) embed.setImage(img.url);
      }

      await starChannel.send({ content: `⭐ **${starCount}** | <#${message.channel.id}>`, embeds: [embed] });
    } catch (e) {
      logger.error("Starboard", e.message);
    }
  },
};
