import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "goodbye",
  description: "Configure the goodbye message when members leave",
  usage: "goodbye <set <#channel> <message> | remove | view>",
  aliases: ["leave", "byemsg"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "goodbye",
    description: "Configure goodbye/leave messages",
    options: [
      {
        name: "set",
        description: "Set goodbye message and channel",
        type: 1,
        options: [
          { name: "channel", description: "Channel to send goodbye messages", type: 7, required: true },
          { name: "message", description: "Goodbye message (use {user}, {server}, {membercount})", type: 3, required: true },
        ],
      },
      { name: "remove", description: "Remove the goodbye message", type: 1 },
      { name: "view", description: "View current goodbye config", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });

    if (sub === "view") {
      const g = db.getGoodbye(message.guild.id);
      const ch = g.channel ? message.guild.channels.cache.get(g.channel) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Config`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${g.message}` : "No goodbye message set.")] });
    }
    if (sub === "remove") {
      db.clearGoodbye(message.guild.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Removed`).setDescription("Goodbye messages have been disabled.")] });
    }
    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a valid channel.")] });
      const msg = args.slice(2).join(" ");
      if (!msg) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a goodbye message.")] });
      db.setGoodbye(message.guild.id, channel.id, msg);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Set`).setDescription(`Goodbye messages will be sent to ${channel}.`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "view") {
      const g = db.getGoodbye(interaction.guild.id);
      const ch = g.channel ? interaction.guild.channels.cache.get(g.channel) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Config`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${g.message}` : "No goodbye message set.")], ephemeral: true });
    }
    if (sub === "remove") {
      db.clearGoodbye(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Removed`).setDescription("Goodbye messages disabled.")] });
    }
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const msg = interaction.options.getString("message");
      db.setGoodbye(interaction.guild.id, channel.id, msg);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Goodbye Set`).setDescription(`Goodbye messages will be sent to ${channel}.`)] });
    }
  },
};
