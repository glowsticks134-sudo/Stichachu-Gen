import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

const LOG_TYPES = ["messagedelete", "messageedit", "memberban", "memberunban", "rolegiven", "roleremoved", "channelcreate", "channeldelete", "nickchange"];

export default {
  name: "setlog",
  description: "Configure logging channels for server events",
  usage: "setlog <type|all> <#channel|disable>",
  aliases: ["logging", "logchannel", "logs"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "setlog",
    description: "Configure a logging channel",
    options: [
      {
        name: "type",
        description: "Log type",
        type: 3,
        required: true,
        choices: [
          ...LOG_TYPES.map(t => ({ name: t, value: t })),
          { name: "all", value: "all" },
        ],
      },
      { name: "channel", description: "Channel to log to (omit to disable)", type: 7, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first() || null;
    if (!type) return message.reply({ content: `${emoji.get("cross")} Types: ${LOG_TYPES.join(", ")}, all` });
    if (type === "all") {
      LOG_TYPES.forEach(t => db.setLog(message.guild.id, t, channel?.id || null));
    } else if (LOG_TYPES.includes(type)) {
      db.setLog(message.guild.id, type, channel?.id || null);
    } else {
      return message.reply({ content: `${emoji.get("cross")} Invalid type. Valid: ${LOG_TYPES.join(", ")}, all` });
    }
    return message.reply({ embeds: [buildEmbed(type, channel)] });
  },

  async slashExecute({ client, interaction }) {
    const type = interaction.options.getString("type");
    const channel = interaction.options.getChannel("channel") || null;
    if (type === "all") {
      LOG_TYPES.forEach(t => db.setLog(interaction.guild.id, t, channel?.id || null));
    } else {
      db.setLog(interaction.guild.id, type, channel?.id || null);
    }
    return interaction.reply({ embeds: [buildEmbed(type, channel)] });
  },
};

function buildEmbed(type, channel) {
  return new EmbedBuilder()
    .setColor(channel ? 0x57f287 : 0x000000)
    .setTitle(`📋 Log ${channel ? "Configured" : "Disabled"}`)
    .setDescription(channel
      ? `**${type}** logs will be sent to ${channel}.`
      : `**${type}** logs have been disabled.`
    );
}
