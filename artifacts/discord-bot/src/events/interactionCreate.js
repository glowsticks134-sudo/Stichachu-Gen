/**
 * "interactionCreate" — central dispatcher for all Discord interactions.
 *
 * Handles:
 *  - Slash command interactions  → command.execute()
 *  - Autocomplete interactions   → command.autocomplete()
 */

import { logger } from '../utils/logger.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  // ── Autocomplete ───────────────────────────────────────────────────────────
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      logger.error(`Autocomplete error for /${interaction.commandName}: ${err.message}`);
    }
    return;
  }

  // ── Slash commands ─────────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command: /${interaction.commandName}`);
    await interaction.reply({
      content: '⚠️ Unknown command. Try `/usage` to see what\'s available.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`Error in /${interaction.commandName}: ${err.message}`);

    const payload = {
      content: '❌ Something went wrong. Please try again in a moment.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
}
