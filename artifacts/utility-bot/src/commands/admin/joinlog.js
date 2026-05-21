import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "joinlog",
  description: "Set a channel to log member joins and leaves",
  usage: "joinlog <set <#channel> | remove | view>",
  aliases: ["memberlog", "joinlogs"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "joinlog",
    description: "Configure the join/leave log channel",
    options: [
      { name: "set", description: "Set the join log channel", type: 1, options: [{ name: "channel", description: "Log channel", type: 7, required: true }] },
      { name: "remove", description: "Disable join logging", type: 1 },
      { name: "view", description: "View current join log config", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    if (sub === "view") {
      const chId = db.getJoinlog(message.guild.id);
      const ch = chId ? message.guild.channels.cache.get(chId) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Join Log`).setDescription(ch ? `Join log: ${ch}` : "No join log set.")] });
    }
    if (sub === "remove") {
      db.clearJoinlog(message.guild.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Join Log Removed`).setDescription("Join logging disabled.")] });
    }
    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid channel.")] });
      db.setJoinlog(message.guild.id, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Join Log Set`).setDescription(`Member join/leave events logged in ${channel}.`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "view") {
      const chId = db.getJoinlog(interaction.guild.id);
      const ch = chId ? interaction.guild.channels.cache.get(chId) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("channel")} Join Log`).setDescription(ch ? `Join log: ${ch}` : "No join log set.")], ephemeral: true });
    }
    if (sub === "remove") {
      db.clearJoinlog(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Join Log Removed`).setDescription("Join logging disabled.")] });
    }
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      db.setJoinlog(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Join Log Set`).setDescription(`Joins/leaves will be logged in ${channel}.`)] });
    }
  },
};
