import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "modlog",
  description: "Set up a moderation log channel",
  usage: "modlog <set <#channel> | remove | view>",
  aliases: ["modlogs", "auditlog"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "modlog",
    description: "Configure the moderation log channel",
    options: [
      { name: "set", description: "Set the mod log channel", type: 1, options: [{ name: "channel", description: "Log channel", type: 7, required: true }] },
      { name: "remove", description: "Disable mod logging", type: 1 },
      { name: "view", description: "View current mod log channel", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    if (sub === "view") {
      const chId = db.getModlog(message.guild.id);
      const ch = chId ? message.guild.channels.cache.get(chId) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("moderation")} Mod Log`).setDescription(ch ? `Mod log channel: ${ch}` : "No mod log channel set.")] });
    }
    if (sub === "remove") {
      db.clearModlog(message.guild.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mod Log Removed`).setDescription("Mod logging disabled.")] });
    }
    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a valid channel.")] });
      db.setModlog(message.guild.id, channel.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mod Log Set`).setDescription(`Mod actions will be logged in ${channel}.`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "view") {
      const chId = db.getModlog(interaction.guild.id);
      const ch = chId ? interaction.guild.channels.cache.get(chId) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("moderation")} Mod Log`).setDescription(ch ? `Mod log: ${ch}` : "No mod log set.")], ephemeral: true });
    }
    if (sub === "remove") {
      db.clearModlog(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mod Log Removed`).setDescription("Mod logging disabled.")] });
    }
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      db.setModlog(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Mod Log Set`).setDescription(`Mod log set to ${channel}.`)] });
    }
  },
};
