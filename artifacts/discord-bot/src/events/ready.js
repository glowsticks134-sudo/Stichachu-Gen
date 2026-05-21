/**
 * "ready" event — fires once after the bot successfully logs in.
 * Sets the bot's activity status and logs confirmation.
 */

import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';

export const name = 'ready';
export const once = true; // Only fire this listener one time

export function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);

  // Set a visible status in the Discord member list
  client.user.setActivity('/createemail to get started', {
    type: ActivityType.Listening,
  });
}
