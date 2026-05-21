import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits } from "discord.js";
import ms from "ms";

class GiveawayEditCommand extends Command {
  constructor() {
    super({
      name: "gedit",
      description: "Edit an existing giveaway",
      usage: "gedit <message_id> <option> <value>",
      aliases: ["giveaway-edit", "giveawayedit", "editgiveaway"],
      category: "giveaway",
      examples: [
        "gedit 1234567890123456789 time 2h",
        "gedit 1234567890123456789 winners 3",
        "gedit 1234567890123456789 prize Steam Gift Card"
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "gedit",
        description: "Edit an existing giveaway",
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway to edit",
            type: 3,
            required: true
          },
          {
            name: "option",
            description: "What to edit (time, winners, prize)",
            type: 3,
            required: true,
            choices: [
              { name: "Add Time", value: "time" },
              { name: "Winners", value: "winners" },
              { name: "Prize", value: "prize" }
            ]
          },
          {
            name: "value",
            description: "The new value",
            type: 3,
            required: true
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.channel.send("Please provide the message ID of the giveaway to edit.");
    }

    if (!args[1]) {
      return message.channel.send("Please specify what to edit: time, winners, or prize.");
    }

    if (!args[2]) {
      return message.channel.send("Please provide the new value.");
    }

    const messageId = args[0];
    const option = args[1].toLowerCase();
    const value = args.slice(2).join(" ");

    try {
      let editOptions = {};

      switch (option) {
        case "time":
          const addTime = ms(value);
          if (!addTime) {
            return message.channel.send("Invalid time format. Use formats like 1h, 30m, 1d.");
          }
          editOptions.addTime = addTime;
          break;
        case "winners":
          const winnerCount = parseInt(value);
          if (isNaN(winnerCount) || winnerCount < 1) {
            return message.channel.send("Winner count must be a valid number greater than 0.");
          }
          editOptions.newWinnerCount = winnerCount;
          break;
        case "prize":
          editOptions.newPrize = value;
          break;
        default:
          return message.channel.send("Invalid option. Use: time, winners, or prize.");
      }

      await client.giveawaysManager.edit(messageId, editOptions);
      return message.channel.send(`Giveaway with ID \`${messageId}\` has been edited successfully.`);
    } catch (error) {
      return message.channel.send(`Failed to edit the giveaway. Make sure the message ID is correct and the giveaway exists.`);
    }
  }

  async slashExecute({ client, interaction }) {
    const messageId = interaction.options.getString("message_id");
    const option = interaction.options.getString("option");
    const value = interaction.options.getString("value");

    try {
      let editOptions = {};

      switch (option) {
        case "time":
          const addTime = ms(value);
          if (!addTime) {
            return interaction.reply("Invalid time format. Use formats like 1h, 30m, 1d.");
          }
          editOptions.addTime = addTime;
          break;
        case "winners":
          const winnerCount = parseInt(value);
          if (isNaN(winnerCount) || winnerCount < 1) {
            return interaction.reply("Winner count must be a valid number greater than 0.");
          }
          editOptions.newWinnerCount = winnerCount;
          break;
        case "prize":
          editOptions.newPrize = value;
          break;
      }

      await client.giveawaysManager.edit(messageId, editOptions);
      return interaction.reply(`Giveaway with ID \`${messageId}\` has been edited successfully.`);
    } catch (error) {
      return interaction.reply(`Failed to edit the giveaway. Make sure the message ID is correct and the giveaway exists.`);
    }
  }
}

export default new GiveawayEditCommand();
