import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "remindinfo",
  description: "View your active reminders",
  usage: "remindinfo",
  aliases: ["rinfo", "reminders", "myreminders"],
  category: "moderation",
  cooldown: 3,
  enabledSlash: true,
  slashData: { name: "remindinfo", description: "View your active reminders" },

  async execute({ client, message, args }) {
    try {
      const reminders = db.getReminders(message.author.id);

      if (reminders.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("info")} No Reminders`)
          .setDescription("You have no active reminders.");

        return message.reply({ embeds: [embed] });
      }

      let content = `**Your Active Reminders:**\n\n`;

      for (let i = 0; i < Math.min(reminders.length, 10); i++) {
        const reminder = reminders[i];
        const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
        
        content += `**#${i + 1}**\n`;
        content += `├─ Message: ${reminder.message.slice(0, 50)}${reminder.message.length > 50 ? '...' : ''}\n`;
        content += `├─ Channel: ${channel ? channel : 'Unknown'}\n`;
        content += `├─ Reminds: <t:${Math.floor(reminder.remind_at / 1000)}:R>\n`;
        content += `└─ Created: <t:${Math.floor(reminder.created_at / 1000)}:R>\n\n`;
      }

      if (reminders.length > 10) {
        content += `*...and ${reminders.length - 10} more reminders*`;
      }

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("remind")} Your Reminders`)
        .setDescription(content);

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Error`)
        .setDescription(`Failed to get reminders: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const reminders = db.getReminders(interaction.user.id);
    if (!reminders.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} No Reminders`).setDescription("You have no active reminders.")], ephemeral: true });
    let content = "";
    reminders.slice(0, 10).forEach((r, i) => { content += `**#${i + 1}** — ${r.message.slice(0, 50)} — <t:${Math.floor(r.remind_at / 1000)}:R>\n`; });
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("remind")} Your Reminders`).setDescription(content)], ephemeral: true });
  },
};
