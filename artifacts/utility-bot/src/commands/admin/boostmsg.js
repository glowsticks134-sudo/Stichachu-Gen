import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "boostmsg",
  description: "Set a message to send when someone boosts the server",
  usage: "boostmsg <set <#channel> <message> | remove | view>",
  aliases: ["boostmessage", "boostthanks"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "boostmsg",
    description: "Configure the boost thank-you message",
    options: [
      {
        name: "set",
        description: "Set the boost message",
        type: 1,
        options: [
          { name: "channel", description: "Channel for boost messages", type: 7, required: true },
          { name: "message", description: "Message (use {user}, {server})", type: 3, required: true },
        ],
      },
      { name: "remove", description: "Remove the boost message", type: 1 },
      { name: "view", description: "View current boost message", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    if (sub === "view") {
      const b = db.getBoost(message.guild.id);
      const ch = b.channel ? message.guild.channels.cache.get(b.channel) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff73fa).setTitle(`${emoji.get("star")} Boost Message`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${b.message}` : "No boost message set.")] });
    }
    if (sub === "remove") {
      db.setBoost(message.guild.id, null, null);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Boost Message Removed`).setDescription("Boost messages disabled.")] });
    }
    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Mention a valid channel.")] });
      const msg = args.slice(2).join(" ");
      if (!msg) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a boost message.")] });
      db.setBoost(message.guild.id, channel.id, msg);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff73fa).setTitle(`${emoji.get("check")} Boost Message Set`).setDescription(`Boost messages will be sent to ${channel}.`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    if (sub === "view") {
      const b = db.getBoost(interaction.guild.id);
      const ch = b.channel ? interaction.guild.channels.cache.get(b.channel) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff73fa).setTitle(`${emoji.get("star")} Boost Message`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${b.message}` : "No boost message set.")], ephemeral: true });
    }
    if (sub === "remove") {
      db.setBoost(interaction.guild.id, null, null);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Boost Message Removed`).setDescription("Boost messages disabled.")] });
    }
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const msg = interaction.options.getString("message");
      db.setBoost(interaction.guild.id, channel.id, msg);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff73fa).setTitle(`${emoji.get("check")} Boost Message Set`).setDescription(`Boost messages will be sent to ${channel}.`)] });
    }
  },
};
