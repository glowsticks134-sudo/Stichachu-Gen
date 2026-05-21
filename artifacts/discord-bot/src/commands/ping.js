/**
 * /ping — Show the bot's WebSocket heartbeat latency. No cooldown.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

export async function execute(interaction) {
  const sent = await interaction.reply({
    embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription('Pinging...')],
    fetchReply: true,
    ephemeral: true,
  });

  const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
  const ws = interaction.client.ws.ping;

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(ws < 100 ? 0x57f287 : ws < 250 ? 0xfee75c : 0xed4245)
        .setTitle('🏓 Pong!')
        .addFields(
          { name: 'Roundtrip', value: `${roundTrip}ms`, inline: true },
          { name: 'WebSocket', value: `${ws}ms`, inline: true },
        )
        .setTimestamp(),
    ],
  });
}
