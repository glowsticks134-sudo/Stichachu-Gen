import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import emoji from "#config/emoji";

class AutoResponderCommand extends Command {
  constructor() {
    super({
      name: "autoresponder",
      description: "Set up automatic responses to specific triggers",
      usage: "autoresponder <add|remove|list> [trigger] [response]",
      aliases: ["autorespond", "trigger"],
      category: "Extra",
      examples: [
        "autoresponder add hello Hi there!",
        "autoresponder remove hello",
        "autoresponder list",
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!client.autoResponses) {
        client.autoResponses = new Map();
      }

      const guildResponses = client.autoResponses.get(message.guild.id) || new Map();

      if (!args[0]) {
        return message.reply({
          content: `${emoji.get("cross")} Please specify an action: \`add\`, \`remove\`, or \`list\`\n**Usage:** \`${this.usage}\``,
        });
      }

      const action = args[0].toLowerCase();

      if (action === "list") {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("autorespond")} **Auto Responses**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        if (guildResponses.size === 0) {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent("No auto responses configured.")
          );
        } else {
          let responsesList = "";
          let count = 0;
          for (const [trigger, response] of guildResponses) {
            count++;
            if (count > 15) {
              responsesList += `\n*...and ${guildResponses.size - 15} more*`;
              break;
            }
            responsesList += `**${count}.** \`${trigger}\` → ${response.substring(0, 50)}${response.length > 50 ? "..." : ""}\n`;
          }
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(responsesList)
          );
        }

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (action === "add") {
        const trigger = args[1]?.toLowerCase();
        const response = args.slice(2).join(" ");

        if (!trigger) {
          return message.reply({
            content: `${emoji.get("cross")} Please provide a trigger word!`,
          });
        }

        if (!response) {
          return message.reply({
            content: `${emoji.get("cross")} Please provide a response!`,
          });
        }

        if (guildResponses.size >= 50) {
          return message.reply({
            content: `${emoji.get("cross")} You've reached the maximum limit of 50 auto responses!`,
          });
        }

        guildResponses.set(trigger, response);
        client.autoResponses.set(message.guild.id, guildResponses);

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("check")} **Auto Response Added**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Trigger:** \`${trigger}\`\n**Response:** ${response}`
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (action === "remove") {
        const trigger = args[1]?.toLowerCase();

        if (!trigger) {
          return message.reply({
            content: `${emoji.get("cross")} Please provide a trigger to remove!`,
          });
        }

        if (!guildResponses.has(trigger)) {
          return message.reply({
            content: `${emoji.get("cross")} No auto response found for \`${trigger}\`!`,
          });
        }

        guildResponses.delete(trigger);
        client.autoResponses.set(message.guild.id, guildResponses);

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("check")} **Auto Response Removed**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Removed auto response for trigger: \`${trigger}\``
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      return message.reply({
        content: `${emoji.get("cross")} Invalid action. Use \`add\`, \`remove\`, or \`list\`.`,
      });
    } catch (error) {
      client.logger?.error("AutoResponderCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }
}

export default new AutoResponderCommand();
