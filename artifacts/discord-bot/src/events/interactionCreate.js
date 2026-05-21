/**
 * "interactionCreate" event — the central dispatcher for all slash commands.
 *
 * Responsibilities:
 *  1. Ignore non-slash-command interactions (buttons, modals, etc.)
 *  2. Look up the matching command in the client's command collection
 *  3. Execute it inside a try/catch so a single bad command can't crash the bot
 */

import { logger } from '../utils/logger.js';

export const name = 'interactionCreate';
export const once = false; // Fire on every interaction

export async function execute(interaction, client) {
  // Only handle chat input (slash) commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command received: /${interaction.commandName}`);
    await interaction.reply({
      content: '⚠️ Unknown command. This might be stale — try again in a moment.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`Error executing /${interaction.commandName}: ${err.message}`);

    // Reply or follow-up depending on whether we already acknowledged the interaction
    const errorPayload = {
      content:
        '❌ Something went wrong while running this command. Please try again later.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorPayload).catch(() => {});
    } else {
      await interaction.reply(errorPayload).catch(() => {});
    }
  }
}
