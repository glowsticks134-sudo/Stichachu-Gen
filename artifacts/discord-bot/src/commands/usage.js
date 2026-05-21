/**
 * /usage — Display the help embed showing all available commands.
 * Matches the style shown in the Memberk Emails bot screenshot.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDomainCommands } from '../utils/domains.js';

export const data = new SlashCommandBuilder()
  .setName('usage')
  .setDescription('Show all available commands');

export async function execute(interaction) {
  const domainCmds = getDomainCommands();

  // Build the "Address Commands" section
  const genLines = ['`/gen` \u2014 random'];
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
