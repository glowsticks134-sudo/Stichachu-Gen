/**
 * /emailinfo — Show detailed information about one of the user's aliases.
 *
 * Displays creation date, current status, and the provider that manages it.
 * Only the alias owner can query their own aliases.
 */

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getAliasByEmail } from '../utils/database.js';
import { checkCooldown, setCooldown } from '../utils/cooldowns.js';
import { activeProvider } from '../utils/emailService.js';

const COOLDOWN_SECS = 10;

const STATUS_EMOJI = {
  active: '🟢',
  deleted: '🔴',
};

const PROVIDER_LABEL = {
  simplelogin: 'SimpleLogin',
  cloudflare: 'Cloudflare Email Routing',
  local: 'Local (catch-all)',
};

export const data = new SlashCommandBuilder()
  .setName('emailinfo')
  .setDescription('Show information about one of your email aliases')
  .addStringOption((option) =>
    option
      .setName('alias')
      .setDescription('The full alias email to look up')
      .setRequired(true),
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetAlias = interaction.options.getString('alias').toLowerCase().trim();

  // ── Cooldown ───────────────────────────────────────────────────────────────
  const { onCooldown, remainingSecs } = checkCooldown('emailinfo', userId, COOLDOWN_SECS);
  if (onCooldown) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⏳ Slow down!')
          .setDescription(`Please wait **${remainingSecs}s** before looking up another alias.`),
      ],
      ephemeral: true,
    });
  }

  setCooldown('emailinfo', userId);

  // ── Fetch alias record ─────────────────────────────────────────────────────
  const record = getAliasByEmail(targetAlias);

  if (!record) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Alias not found')
          .setDescription(
            `\`${targetAlias}\` was not found.\n` +
            'Run `/myemails` to see your current aliases.',
          ),
      ],
      ephemeral: true,
    });
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  if (record.discord_user_id !== userId) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('🚫 Permission denied')
          .setDescription("You can only look up aliases that belong to you."),
      ],
      ephemeral: true,
    });
  }

  // ── Build info embed ───────────────────────────────────────────────────────
  const createdAt = new Date(record.created_at);
  const statusEmoji = STATUS_EMOJI[record.status] ?? '❓';
  const providerLabel = PROVIDER_LABEL[activeProvider] ?? activeProvider;

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(record.status === 'active' ? Colors.Green : Colors.Grey)
        .setTitle('📋 Alias Info')
        .addFields(
          {
            name: '📧 Alias email',
            value: `\`${record.alias_email}\``,
            inline: false,
          },
          {
            name: '📅 Created',
            value: createdAt.toLocaleString('en-US', {
              dateStyle: 'long',
              timeStyle: 'short',
              timeZone: 'UTC',
            }) + ' UTC',
            inline: true,
          },
          {
            name: '⚙️ Provider',
            value: providerLabel,
            inline: true,
          },
          {
            name: '🔵 Status',
            value: `${statusEmoji} ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
            inline: true,
          },
          {
            name: '🆔 Internal ID',
            value: `#${record.id}`,
            inline: true,
          },
        )
        .setFooter({ text: 'Only you can see this message' })
        .setTimestamp(createdAt),
    ],
    ephemeral: true,
  });
}
