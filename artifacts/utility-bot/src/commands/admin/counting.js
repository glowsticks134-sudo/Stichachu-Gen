import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "counting",
  description: "Setup a counting channel",
  usage: "counting <set #channel|disable>",
  aliases: ["countchannel", "counter"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "counting",
    description: "Configure a counting channel",
    options: [
      { name: "set", description: "Set the counting channel", type: 1, options: [{ name: "channel", description: "Counting channel", type: 7, required: true }] },
      { name: "disable", description: "Disable counting", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (sub === "set") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ content: `${emoji.get("cross")} Please mention a channel.` });
      db.setCounting(message.guild.id, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🔢 Counting Channel Set").setDescription(`Members must count in order in ${channel}. Wrong numbers get deleted!`)] });
    }
    if (sub === "disable") {
      db.setCounting(message.guild.id, null);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle("🔢 Counting Disabled")] });
    }
    return message.reply({ content: `${emoji.get("cross")} Usage: \`${this.usage}\`` });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      db.setCounting(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🔢 Counting Channel Set").setDescription(`Counting is active in ${channel}!`)] });
    }
    db.setCounting(interaction.guild.id, null);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle("🔢 Counting Disabled")] });
  },
};
