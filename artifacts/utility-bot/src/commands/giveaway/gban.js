import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";

class GiveawayBanCommand extends Command {
  constructor() {
    super({
      name: "gban",
      description: "Ban a user from participating in giveaways",
      usage: "gban <user_id> <duration>",
      aliases: ["giveaway-ban", "giveawayban", "bangiveaway"],
      category: "giveaway",
      examples: [
        "gban 1234567890123456789 30m",
        "gban 1234567890123456789 2h",
        "gban 1234567890123456789 7d"
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gban",
        description: "Ban a user from participating in giveaways",
        options: [
          {
            name: "user",
            description: "The user to ban from giveaways",
            type: 6,
            required: true
          },
          {
            name: "duration",
            description: "Ban duration (e.g., 30m, 2h, 7d)",
            type: 3,
            required: true
          }
        ]
      }
    });

    this.bannedUsers = new Map();
  }

  parseDuration(durationStr) {
    const regex = /^(\d+)(m|h|d)$/i;
    const match = durationStr.match(regex);
    
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    let milliseconds;
    switch (unit) {
      case "m":
        milliseconds = value * 60 * 1000;
        break;
      case "h":
        milliseconds = value * 60 * 60 * 1000;
        break;
      case "d":
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        return null;
    }

    return { milliseconds, value, unit };
  }

  formatDuration(value, unit) {
    const units = { m: "minute", h: "hour", d: "day" };
    const unitName = units[unit];
    return `${value} ${unitName}${value > 1 ? "s" : ""}`;
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the user ID to ban from giveaways.");
    }

    if (!args[1]) {
      return message.channel.send("Please provide the ban duration (e.g., 30m, 2h, 7d).");
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    const durationStr = args[1];

    const duration = this.parseDuration(durationStr);
    if (!duration) {
      return message.channel.send("Invalid duration format. Use formats like 30m (minutes), 2h (hours), or 7d (days).");
    }

    try {
      const banKey = `${message.guild.id}-${userId}`;
      const expiresAt = Date.now() + duration.milliseconds;
      
      this.bannedUsers.set(banKey, {
        odId: message.guild.id,
        odId: userId,
        expiresAt: expiresAt,
        bannedBy: message.author.id
      });

      const formattedDuration = this.formatDuration(duration.value, duration.unit);
      return message.channel.send(`User \`${userId}\` has been banned from giveaways for ${formattedDuration}.`);
    } catch (error) {
      return message.channel.send(`Failed to ban user from giveaways. Please try again.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const user = interaction.options.getUser("user");
    const durationStr = interaction.options.getString("duration");

    const duration = this.parseDuration(durationStr);
    if (!duration) {
      return interaction.reply("Invalid duration format. Use formats like 30m (minutes), 2h (hours), or 7d (days).");
    }

    try {
      const banKey = `${interaction.guild.id}-${user.id}`;
      const expiresAt = Date.now() + duration.milliseconds;
      
      this.bannedUsers.set(banKey, {
        guildId: interaction.guild.id,
        userId: user.id,
        expiresAt: expiresAt,
        bannedBy: interaction.user.id
      });

      const formattedDuration = this.formatDuration(duration.value, duration.unit);
      return interaction.reply(`User \`${user.tag}\` has been banned from giveaways for ${formattedDuration}.`);
    } catch (error) {
      return interaction.reply(`Failed to ban user from giveaways. Please try again.`);
    }
  }
}

export default new GiveawayBanCommand();
