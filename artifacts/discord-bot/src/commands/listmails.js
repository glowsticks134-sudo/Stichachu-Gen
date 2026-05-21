/**
 * /listmails — Show all active email addresses owned by the calling user.
 * Reply is ephemeral so addresses stay private in shared channels.
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasesByUser } from '../utils/database.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';

const COOLDOWN_SECS = 10;

export const data = new SlashCommandBuilder()
  .setName('listmails')
  .setDescription('List all your email addresses');

export async function execute(interaction) {
  const userId = interaction.user.id;

  const { onCooldown, remainingSecs } = checkCooldown('listmails', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(`⏳ Wait **${remainingSecs}s** before listing again.`),
      ],
      ephemeral: true,
    });
  }
  setCooldown('listmails', userId);

  const aliases = getAliasesByUser(userId);

  if (aliases.length === 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('📭 No addresses yet')
          .setDescription('Use `/gen` to generate your first email address!'),
      ],
      ephemeral: true,
    });
  }

  // Group aliases by domain for a cleaner display
  const byDomain = {};
  for (const row of aliases) {
    const domain = row.domain || row.alias_email.split('@')[1] || 'unknown';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(row.alias_email);
  }

  const fields = Object.entries(byDomain).map(([domain, emails]) => ({
    name: `@${domain}`,
    value: emails.map((e) => `\`${e}\``).join('\n'),
    inline: false,
  }));

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📬 Your Addresses (${aliases.length})`)
        .addFields(fields)
        .setFooter({ text: 'Emails sent to these addresses arrive in your DMs' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
