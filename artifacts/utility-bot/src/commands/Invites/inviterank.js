import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

class InviteRankCommand extends Command {
  constructor() {
    super({
      name: "inviterank",
      description: "Configure invite ranks",
      usage: "inviterank <add|remove> <role> [invites]",
      aliases: ["invrank", "setinviterank"],
      category: "Invites",
      examples: [
        "inviterank add @Member 10",
        "inviterank remove @Member",
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "inviterank",
        description: "Configure invite ranks",
        options: [
          {
            name: "add",
            description: "Add a new invite rank",
            type: 1,
            options: [
              {
                name: "role",
                description: "The role to assign",
                type: 8,
                required: true,
              },
              {
                name: "invites",
                description: "Number of invites required",
                type: 4,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove an invite rank",
            type: 1,
            options: [
              {
                name: "role",
                description: "The role to remove from invite ranks",
                type: 8,
                required: true,
              },
            ],
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    if (!args[0]) {
      return message.reply(this._createUsageContainer());
    }

    const subCommand = args[0].toLowerCase();

    if (subCommand === "add") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === args[1]?.toLowerCase());
      const invites = parseInt(args[2]);

      if (!role) {
        return message.reply(this._createErrorContainer("Please provide a valid role."));
      }

      if (isNaN(invites) || invites < 1) {
        return message.reply(this._createErrorContainer("Please provide a valid number of invites (minimum 1)."));
      }

      const response = await this._addRank(message.guild, role, invites);
      return message.reply(response);
    } else if (subCommand === "remove") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === args[1]?.toLowerCase());

      if (!role) {
        return message.reply(this._createErrorContainer("Please provide a valid role."));
      }

      const response = await this._removeRank(message.guild, role);
      return message.reply(response);
    } else {
      return message.reply(this._createUsageContainer());
    }
  }

  async slashExecute({ client, interaction }) {
    const subCommand = interaction.options.getSubcommand();

    if (subCommand === "add") {
      const role = interaction.options.getRole("role");
      const invites = interaction.options.getInteger("invites");
      const response = await this._addRank(interaction.guild, role, invites);
      return interaction.reply(response);
    } else if (subCommand === "remove") {
      const role = interaction.options.getRole("role");
      const response = await this._removeRank(interaction.guild, role);
      return interaction.reply(response);
    }
  }

  async _addRank(guild, role, invites) {
    const trackingEnabled = db.isInviteTrackingEnabled(guild.id);
    
    if (!trackingEnabled) {
      return this._createErrorContainer("Invite tracking is disabled in this server.");
    }

    if (role.managed) {
      return this._createErrorContainer("You cannot assign a bot-managed role.");
    }

    if (guild.roles.everyone.id === role.id) {
      return this._createErrorContainer("You cannot assign the @everyone role.");
    }

    if (!role.editable) {
      return this._createErrorContainer("I cannot assign this role. Make sure it's below my highest role.");
    }

    const result = db.addInviteRank(guild.id, role.id, invites);

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("check")} **Invite Rank ${result.updated ? "Updated" : "Added"}**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    let message = result.updated 
      ? `Updated invite rank for ${role.toString()}\n\n`
      : `Added new invite rank\n\n`;
    
    message += `${emoji.get("role")} **Role:** ${role.toString()}\n`;
    message += `${emoji.get("invites")} **Required Invites:** ${invites}`;

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(message)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  async _removeRank(guild, role) {
    const trackingEnabled = db.isInviteTrackingEnabled(guild.id);
    
    if (!trackingEnabled) {
      return this._createErrorContainer("Invite tracking is disabled in this server.");
    }

    const removed = db.removeInviteRank(guild.id, role.id);

    if (!removed) {
      return this._createErrorContainer("No invite rank found for this role.");
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("check")} **Invite Rank Removed**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Successfully removed invite rank for ${role.toString()}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  _createUsageContainer() {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("info")} **Invite Rank Usage**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Commands:**\n` +
        `├─ \`inviterank add <role> <invites>\` - Add an invite rank\n` +
        `└─ \`inviterank remove <role>\` - Remove an invite rank\n\n` +
        `**Examples:**\n` +
        `├─ \`inviterank add @Member 10\`\n` +
        `└─ \`inviterank remove @Member\``
      )
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  _createErrorContainer(message) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("cross")} **Error**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(message)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }
}

export default new InviteRankCommand();
