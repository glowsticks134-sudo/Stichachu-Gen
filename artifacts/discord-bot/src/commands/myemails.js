/**
 * /myemails — List all active email aliases owned by the calling user.
 *
 * Results are shown only to the user who ran the command (ephemeral reply)
 * so their aliases stay private in shared channels.
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasesByUser } from '../utils/database.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';

const COOLDOWN_SECS = 10;

export const data = new SlashCommandBuilder()
  .setName('myemails')
  .setDescription('Show all email aliases you currently own');

export async function execute(interaction) {
  const userId = interaction.user.id;

  // ── Cooldown ───────────────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('myemails', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⏳ Slow down!')
          .setDescription(`Please wait **${remainingSecs}s** before checking your aliases again.`),
      ],
      ephemeral: true,
    });
  }

  setCooldown('myemails', userId);

  // ── Fetch aliases ──────────────────────────────────────────────────────────
  const aliases = getAliasesByUser(userId);

  if (aliases.length === 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setTitle('📭 No aliases yet')
          .setDescription(
            "You don't have any active email aliases.\n" +
            'Run `/createemail` to generate your first one!',
          ),
      ],
      ephemeral: true,
    });
  }

  // Build one line per alias: index, email, creation date
  const lines = aliases.map((row, i) => {
    const date = new Date(row.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return `**${i + 1}.** \`${row.alias_email}\` — created ${date}`;
  });

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`📬 Your email aliases (${aliases.length})`)
        .setDescription(lines.join('\n'))
        .setFooter({ text: 'Use /deleteemail to remove an alias • Only you can see this' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
