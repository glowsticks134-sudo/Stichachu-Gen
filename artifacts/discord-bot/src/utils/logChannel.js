/**
 * Log channel utility.
 *
 * If LOG_CHANNEL_ID is set in .env, the bot will post embed messages to that
 * channel when aliases are created or deleted.
 *
 * This gives server admins a real-time audit feed without cluttering user DMs.
 *
 * Setup:
 *   1. Create a private channel in your server (e.g. #bot-logs)
 *   2. Right-click the channel → Copy Channel ID
 *   3. Set LOG_CHANNEL_ID=<id> in your Secrets
 */

import { EmbedBuilder } from 'discord.js';
import { getClient } from './clientStore.js';
import { logger } from './logger.js';

/**
 * Post an embed to the configured log channel.
 * Silently does nothing if LOG_CHANNEL_ID is not set.
 *
 * @param {{ color: number, title: string, fields: { name: string, value: string, inline?: boolean }[] }} options
 */
export async function sendLogMessage({ color, title, fields = [] }) {
  const channelId = process.env.LOG_CHANNEL_ID;
  if (!channelId) return; // Log channel not configured — skip silently

  let client;
  try {
    client = getClient();
  } catch {
    return; // Client not ready yet
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      logger.warn(`LOG_CHANNEL_ID ${channelId} is not a text channel`);
      return;
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle(title)
          .addFields(fields)
          .setTimestamp(),
      ],
    });
  } catch (err) {
    // Don't crash the bot if logging fails — just warn
    logger.warn(`Could not post to log channel: ${err.message}`);
  }
}
