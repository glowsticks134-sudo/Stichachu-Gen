import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "welcome",
  description: "Configure the welcome message for new members",
  usage: "welcome <set <#channel> <message> | remove | view>",
  aliases: ["welcomemsg", "setwelcome"],
  category: "admin",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "welcome",
    description: "Configure welcome messages",
    options: [
      {
        name: "set",
        description: "Set the welcome channel and message",
        type: 1,
        options: [
          { name: "channel", description: "Channel to send welcome messages", type: 7, required: true },
          { name: "message", description: "Welcome message (use {user}, {server}, {membercount})", type: 3, required: true },
        ],
      },
      { name: "remove", description: "Remove the welcome message", type: 1 },
      { name: "view", description: "View current welcome config", type: 1 },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    if (!sub || !["set", "remove", "view"].includes(sub)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\`\n\nVariables: \`{user}\`, \`{server}\`, \`{membercount}\``)] });
    }

    if (sub === "view") {
      const w = db.getWelcome(message.guild.id);
      const ch = w.channel ? message.guild.channels.cache.get(w.channel) : null;
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Config`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${w.message}` : "No welcome message set.")] });
    }

    if (sub === "remove") {
      db.clearWelcome(message.guild.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Removed`).setDescription("Welcome messages have been disabled.")] });
    }

    if (sub === "set") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a valid channel.")] });
      const msg = args.slice(2).join(" ");
      if (!msg) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a welcome message.")] });
      db.setWelcome(message.guild.id, channel.id, msg);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Set`).setDescription(`Welcome messages will be sent to ${channel}.\n**Message:** ${msg}`)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();

    if (sub === "view") {
      const w = db.getWelcome(interaction.guild.id);
      const ch = w.channel ? interaction.guild.channels.cache.get(w.channel) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Config`).setDescription(ch ? `**Channel:** ${ch}\n**Message:** ${w.message}` : "No welcome message set.")], ephemeral: true });
    }

    if (sub === "remove") {
      db.clearWelcome(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Removed`).setDescription("Welcome messages have been disabled.")] });
    }

    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const msg = interaction.options.getString("message");
      db.setWelcome(interaction.guild.id, channel.id, msg);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Welcome Set`).setDescription(`Welcome messages will be sent to ${channel}.\n**Message:** ${msg}`)] });
    }
  },
};
