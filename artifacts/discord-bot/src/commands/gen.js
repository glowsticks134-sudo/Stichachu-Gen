/**
 * /gen — Generate an alias on a randomly selected domain.
 *
 * Uses the full list of configured domains (from DOMAIN_COMMANDS or DOMAINS)
 * and picks one at random each time.
 */

import { SlashCommandBuilder } from 'discord.js';
import { randomDomain } from '../utils/domains.js';
import { handleGenerate } from '../utils/aliasGenerator.js';

export const data = new SlashCommandBuilder()
  .setName('gen')
  .setDescription('Generate a random email address on a random domain');

export async function execute(interaction) {
  let domain;
  try {
    domain = randomDomain();
  } catch (err) {
    return interaction.reply({
      content: `❌ ${err.message}`,
      ephemeral: true,
    });
  }
  return handleGenerate(interaction, domain);
}
