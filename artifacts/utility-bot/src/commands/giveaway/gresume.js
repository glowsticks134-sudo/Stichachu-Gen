import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";

class GiveawayResumeCommand extends Command {
  constructor() {
    super({
      name: "gresume",
      description: "Resume a paused giveaway",
      usage: "gresume <message_id>",
      aliases: ["giveaway-resume", "giveawayresume", "resumegiveaway", "gunpause"],
      category: "giveaway",
      examples: ["gresume 1234567890123456789"],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gresume",
        description: "Resume a paused giveaway",
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway to resume",
            type: 3,
            required: true
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the message ID of the giveaway to resume.");
    }

    const messageId = args[0];

    try {
      await client.giveawaysManager.unpause(messageId);
      return message.channel.send(`Giveaway with ID \`${messageId}\` has been resumed successfully.`);
    } catch (error) {
      return message.channel.send(`Failed to resume the giveaway. Make sure the message ID is correct and the giveaway is paused.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const messageId = interaction.options.getString("message_id");

    try {
      await client.giveawaysManager.unpause(messageId);
      return interaction.reply(`Giveaway with ID \`${messageId}\` has been resumed successfully.`);
    } catch (error) {
      return interaction.reply(`Failed to resume the giveaway. Make sure the message ID is correct and the giveaway is paused.`);
    }
  }
}

export default new GiveawayResumeCommand();
