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

class AutoReactCommand extends Command {
  constructor() {
    super({
      name: "autoreact",
      description: "Set up automatic reactions in a channel",
      usage: "autoreact <add|remove|list> [channel] [emoji]",
      aliases: ["ar", "react"],
      category: "Extra",
      examples: [
        "autoreact add #memes 👍",
        "autoreact remove #memes",
        "autoreact list",
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!client.autoReactions) {
        client.autoReactions = new Map();
      }

      const guildReactions = client.autoReactions.get(message.guild.id) || new Map();

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
            `${emoji.get("autoreact")} **Auto Reactions**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        if (guildReactions.size === 0) {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent("No auto reactions configured.")
          );
        } else {
          let reactionsList = "";
          for (const [channelId, emojis] of guildReactions) {
            const channel = message.guild.channels.cache.get(channelId);
            if (channel) {
              reactionsList += `**${channel}:** ${emojis.join(", ")}\n`;
            }
          }
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(reactionsList || "No valid channels found.")
          );
        }

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (action === "add") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        const reactionEmoji = args[2];

        if (!channel) {
          return message.reply({
            content: `${emoji.get("cross")} Please mention a valid channel!`,
          });
        }

        if (!reactionEmoji) {
          return message.reply({
            content: `${emoji.get("cross")} Please provide an emoji to react with!`,
          });
        }

        const channelReactions = guildReactions.get(channel.id) || [];
        if (!channelReactions.includes(reactionEmoji)) {
          channelReactions.push(reactionEmoji);
        }
        guildReactions.set(channel.id, channelReactions);
        client.autoReactions.set(message.guild.id, guildReactions);

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("check")} **Auto React Added**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `I will now react with ${reactionEmoji} on all messages in ${channel}.`
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (action === "remove") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

        if (!channel) {
          return message.reply({
            content: `${emoji.get("cross")} Please mention a valid channel!`,
          });
        }

        guildReactions.delete(channel.id);
        client.autoReactions.set(message.guild.id, guildReactions);

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${emoji.get("check")} **Auto React Removed**`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Auto reactions have been removed from ${channel}.`
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
      client.logger?.error("AutoReactCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred.`,
      });
    }
  }
}

export default new AutoReactCommand();
