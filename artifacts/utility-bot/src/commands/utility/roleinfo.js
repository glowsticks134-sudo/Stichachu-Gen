import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

class RoleInfoCommand extends Command {
  constructor() {
    super({
      name: "roleinfo",
      description: "Display detailed information about a role",
      usage: "roleinfo <@role | role name>",
      aliases: ["ri", "role"],
      category: "utility",
      examples: ["roleinfo @Moderator", "roleinfo Admin"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "roleinfo",
        description: "Display detailed information about a role",
        options: [{ name: "role", description: "The role to view information for", type: 8, required: true }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!args[0]) {
        return message.reply({
          content: `${emoji.get("cross")} Please specify a role!\n**Usage:** \`${this.usage}\``,
        });
      }

      const role = message.mentions.roles.first() || 
                   message.guild.roles.cache.find(r => 
                     r.name.toLowerCase() === args.join(" ").toLowerCase() ||
                     r.id === args[0]
                   );

      if (!role) {
        return message.reply({
          content: `${emoji.get("cross")} Role not found!`,
        });
      }

      const permissions = role.permissions.toArray();
      const keyPerms = permissions.slice(0, 10).join(", ") || "None";

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("role")} **Role Information**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const generalInfo = 
        `**General Information:**\n` +
        `├─ **Name:** ${role.name}\n` +
        `├─ **ID:** \`${role.id}\`\n` +
        `├─ **Color:** ${role.hexColor}\n` +
        `├─ **Position:** ${role.position}\n` +
        `├─ **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>\n` +
        `└─ **Mentionable:** ${role.mentionable ? "Yes" : "No"}`;

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(generalInfo)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const extraInfo = 
        `**Extra Information:**\n` +
        `├─ **Hoisted:** ${role.hoist ? "Yes" : "No"}\n` +
        `├─ **Managed:** ${role.managed ? "Yes" : "No"}\n` +
        `├─ **Members:** ${role.members.size}\n` +
        `└─ **Mention:** ${role}`;

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(extraInfo)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const permInfo = 
        `**Key Permissions:**\n` +
        `\`${keyPerms}\`` +
        (permissions.length > 10 ? `\n*+${permissions.length - 10} more permissions*` : "");

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(permInfo)
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("RoleInfoCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while fetching role info.`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      const role = interaction.options.getRole("role");
      const permissions = role.permissions.toArray();
      const keyPerms = permissions.slice(0, 10).join(", ") || "None";

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.get("role")} **Role Information**`));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      const generalInfo = `**General Information:**\n├─ **Name:** ${role.name}\n├─ **ID:** \`${role.id}\`\n├─ **Color:** ${role.hexColor}\n├─ **Position:** ${role.position}\n├─ **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>\n└─ **Mentionable:** ${role.mentionable ? "Yes" : "No"}`;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(generalInfo));

      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      const extraInfo = `**Extra Information:**\n├─ **Hoisted:** ${role.hoist ? "Yes" : "No"}\n├─ **Managed:** ${role.managed ? "Yes" : "No"}\n├─ **Members:** ${role.members.size}\n└─ **Mention:** ${role}`;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(extraInfo));

      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      const permInfo = `**Key Permissions:**\n\`${keyPerms}\`${permissions.length > 10 ? `\n*+${permissions.length - 10} more permissions*` : ""}`;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(permInfo));

      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      await interaction.reply({ content: `${emoji.get("cross")} An error occurred.`, ephemeral: true });
    }
  }
}

export default new RoleInfoCommand();
