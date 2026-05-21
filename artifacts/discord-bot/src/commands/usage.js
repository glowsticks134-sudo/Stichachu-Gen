/**
 * /usage — Display the help embed showing all available commands.
 * Updated to include /delete and /stats in the Manage section.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDomainCommands } from '../utils/domains.js';

export const data = new SlashCommandBuilder()
  .setName('usage')
  .setDescription('Show all available commands');

export async function execute(interaction) {
  const domainCmds = getDomainCommands();

  // Address Commands section
  const genLines = ['`/gen` \u2014 random domain'];
  for (const { prefix, domain } of domainCmds) {
    genLines.push(`\`/${prefix}\` \u2014 @${domain}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: interaction.client.user.username,
      iconURL: interaction.client.user.displayAvatarURL(),
    })
    .addFields(
      {
        name: 'Address Commands',
        value: genLines.join('\n'),
        inline: false,
      },
      {
        name: 'Manage',
        value:
          '`/listmails` \u2014 list your addresses\n' +
          '`/delete` \u2014 remove an address (with autocomplete)\n' +
          '`/stats` \u2014 bot statistics\n' +
          '`/ping` \u2014 bot latency\n' +
          '`/usage` \u2014 show this message',
        inline: false,
      },
      {
        name: 'Note',
        value: 'Emails are delivered via Discord DM. No setup required!',
        inline: false,
      },
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
