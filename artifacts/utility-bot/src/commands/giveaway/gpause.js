import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";

class GiveawayPauseCommand extends Command {
  constructor() {
    super({
      name: "gpause",
      description: "Pause an active giveaway",
      usage: "gpause <message_id>",
      aliases: ["giveaway-pause", "giveawaypause", "pausegiveaway"],
      category: "giveaway",
      examples: ["gpause 1234567890123456789"],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gpause",
        description: "Pause an active giveaway",
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway to pause",
            type: 3,
            required: true
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the message ID of the giveaway to pause.");
    }

    const messageId = args[0];

    try {
      await client.giveawaysManager.pause(messageId);
      return message.channel.send(`Giveaway with ID \`${messageId}\` has been paused successfully.`);
    } catch (error) {
      return message.channel.send(`Failed to pause the giveaway. Make sure the message ID is correct and the giveaway is active.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const messageId = interaction.options.getString("message_id");

    try {
      await client.giveawaysManager.pause(messageId);
      return interaction.reply(`Giveaway with ID \`${messageId}\` has been paused successfully.`);
    } catch (error) {
      return interaction.reply(`Failed to pause the giveaway. Make sure the message ID is correct and the giveaway is active.`);
    }
  }
}

export default new GiveawayPauseCommand();
