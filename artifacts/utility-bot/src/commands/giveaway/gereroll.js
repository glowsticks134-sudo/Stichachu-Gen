import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";

class GiveawayRerollCommand extends Command {
  constructor() {
    super({
      name: "gereroll",
      description: "Reroll a giveaway winner",
      usage: "gereroll <message_id>",
      aliases: ["greroll", "giveaway-reroll", "giveawayreroll"],
      category: "giveaway",
      examples: ["gereroll 1234567890123456789"],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gereroll",
        description: "Reroll a giveaway winner",
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway to reroll",
            type: 3,
            required: true
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the message ID of the giveaway to reroll.");
    }

    const messageId = args[0];

    try {
      await client.giveawaysManager.reroll(messageId);
      return message.channel.send(`Giveaway with ID \`${messageId}\` has been rerolled successfully.`);
    } catch (error) {
      return message.channel.send(`Failed to reroll the giveaway. Make sure the message ID is correct and the giveaway has ended.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const messageId = interaction.options.getString("message_id");

    try {
      await client.giveawaysManager.reroll(messageId);
      return interaction.reply(`Giveaway with ID \`${messageId}\` has been rerolled successfully.`);
    } catch (error) {
      return interaction.reply(`Failed to reroll the giveaway. Make sure the message ID is correct and the giveaway has ended.`);
    }
  }
}

export default new GiveawayRerollCommand();
