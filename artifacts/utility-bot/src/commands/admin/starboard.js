import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "starboard",
  description: "Setup or disable the starboard",
  usage: "starboard <set #channel [threshold]|disable>",
  aliases: ["star", "stars"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "starboard",
    description: "Configure the starboard",
    options: [
      {
        name: "set",
        description: "Set the starboard channel",
        type: 1,
        options: [
          { name: "channel", description: "Channel for starred messages", type: 7, required: true },
          { name: "threshold", description: "Stars needed (default 3)", type: 4, required: false, min_value: 1, max_value: 20 },
        ],
      },
      { name: "disable", description: "Disable the starboard", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (sub === "set") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ content: `${emoji.get("cross")} Please mention a channel.` });
      const threshold = parseInt(args[2]) || 3;
      db.setStarboard(message.guild.id, channel.id, threshold);
      return message.reply({ embeds: [buildSetEmbed(channel, threshold)] });
    }
    if (sub === "disable") {
      db.setStarboard(message.guild.id, null, 3);
      return message.reply({ embeds: [buildDisabledEmbed()] });
    }
    return message.reply({ content: `${emoji.get("cross")} Usage: \`${this.usage}\`` });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const threshold = interaction.options.getInteger("threshold") || 3;
      db.setStarboard(interaction.guild.id, channel.id, threshold);
      return interaction.reply({ embeds: [buildSetEmbed(channel, threshold)] });
    }
    if (sub === "disable") {
      db.setStarboard(interaction.guild.id, null, 3);
      return interaction.reply({ embeds: [buildDisabledEmbed()] });
    }
  },
};

function buildSetEmbed(channel, threshold) {
  return new EmbedBuilder().setColor(0xffd700)
    .setTitle("⭐ Starboard Configured")
    .setDescription(`Messages with **${threshold}+** ⭐ reactions will appear in ${channel}!`);
}

function buildDisabledEmbed() {
  return new EmbedBuilder().setColor(0x000000).setTitle("⭐ Starboard Disabled").setDescription("The starboard has been disabled.");
}
