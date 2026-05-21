import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "autopingsetup",
  description: "Auto-ping a role whenever someone sends a message in a channel",
  usage: "autopingsetup <set <#channel> <@role> | remove <#channel> | list>",
  aliases: ["autoping", "channelping"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "autopingsetup",
    description: "Configure auto-pings for channels",
    options: [
      {
        name: "set",
        description: "Auto-ping a role in a channel",
        type: 1,
        options: [
          { name: "channel", description: "Channel to watch", type: 7, required: true },
          { name: "role", description: "Role to ping", type: 8, required: true },
        ],
      },
      { name: "remove", description: "Remove auto-ping for a channel", type: 1, options: [{ name: "channel", description: "Channel to stop pinging in", type: 7, required: true }] },
      { name: "list", description: "List all auto-ping configs", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    const guildId = message.guild.id;

    if (sub === "list") {
      const pings = db.getAllAutopings(guildId);
      if (!pings.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto Pings`).setDescription("No auto-pings configured.")] });
      const lines = pings.map(p => {
        const ch = message.guild.channels.cache.get(p.channel_id);
        const role = message.guild.roles.cache.get(p.role_id);
        return `• ${ch || p.channel_id} → ${role || p.role_id}`;
      });
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto Pings`).setDescription(lines.join("\n"))] });
    }

    if (sub === "remove") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid channel.")] });
      db.removeAutoping(guildId, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto Ping Removed`).setDescription(`Auto-ping removed for ${channel}.`)] });
    }

    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
      if (!channel || !role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid channel and role.")] });
      db.setAutoping(guildId, channel.id, role.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto Ping Set`).setDescription(`${role} will be pinged whenever someone sends in ${channel}.`)] });
    }

    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "list") {
      const pings = db.getAllAutopings(guildId);
      if (!pings.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto Pings`).setDescription("No auto-pings configured.")], ephemeral: true });
      const lines = pings.map(p => {
        const ch = interaction.guild.channels.cache.get(p.channel_id);
        const role = interaction.guild.roles.cache.get(p.role_id);
        return `• ${ch || p.channel_id} → ${role || p.role_id}`;
      });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Auto Pings`).setDescription(lines.join("\n"))], ephemeral: true });
    }

    if (sub === "remove") {
      const channel = interaction.options.getChannel("channel");
      db.removeAutoping(guildId, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto Ping Removed`).setDescription(`Auto-ping removed for ${channel}.`)] });
    }

    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      db.setAutoping(guildId, channel.id, role.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Auto Ping Set`).setDescription(`${role} will be pinged on messages in ${channel}.`)] });
    }
  },
};
