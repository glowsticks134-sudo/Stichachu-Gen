import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";
import gbanCommand from "./gban.js";

class GiveawayUnbanCommand extends Command {
  constructor() {
    super({
      name: "gunban",
      description: "Unban a user from giveaways",
      usage: "gunban <user_id>",
      aliases: ["giveaway-unban", "giveawayunban", "unbangiveaway"],
      category: "giveaway",
      examples: ["gunban 1234567890123456789"],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gunban",
        description: "Unban a user from giveaways",
        options: [
          {
            name: "user",
            description: "The user to unban from giveaways",
            type: 6,
            required: true
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the user ID to unban from giveaways.");
    }

    const userId = args[0].replace(/[<@!>]/g, "");

    try {
      const banKey = `${message.guild.id}-${userId}`;
      
      if (gbanCommand.bannedUsers.has(banKey)) {
        gbanCommand.bannedUsers.delete(banKey);
        return message.channel.send(`User \`${userId}\` has been unbanned from giveaways.`);
      } else {
        return message.channel.send(`User \`${userId}\` is not banned from giveaways.`);
      }
    } catch (error) {
      return message.channel.send(`Failed to unban user from giveaways. Please try again.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const user = interaction.options.getUser("user");

    try {
      const banKey = `${interaction.guild.id}-${user.id}`;
      
      if (gbanCommand.bannedUsers.has(banKey)) {
        gbanCommand.bannedUsers.delete(banKey);
        return interaction.reply(`User \`${user.tag}\` has been unbanned from giveaways.`);
      } else {
        return interaction.reply(`User \`${user.tag}\` is not banned from giveaways.`);
      }
    } catch (error) {
      return interaction.reply(`Failed to unban user from giveaways. Please try again.`);
    }
  }
}

export default new GiveawayUnbanCommand();
