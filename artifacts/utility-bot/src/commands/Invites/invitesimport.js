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

class InvitesImportCommand extends Command {
  constructor() {
    super({
      name: "invitesimport",
      description: "Import existing guild invites to users",
      usage: "invitesimport [@member]",
      aliases: ["importinvites", "importinv"],
      category: "Invites",
      examples: [
        "invitesimport",
        "invitesimport @user",
      ],
      cooldown: 30,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      permissions: [PermissionFlagsBits.ManageGuild],
      enabledSlash: true,
      slashData: {
        name: "invitesimport",
        description: "Import existing guild invites to users",
        options: [
          {
            name: "user",
            description: "Import invites for a specific user only",
            type: 6,
            required: false,
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    const target = message.mentions.members.first();
    const response = await this._importInvites(message.guild, target?.user);
    return message.reply(response);
  }

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const user = interaction.options.getUser("user");
    const response = await this._importInvites(interaction.guild, user);
    return interaction.editReply(response);
  }

  async _importInvites(guild, specificUser = null) {
    if (specificUser && specificUser.bot) {
      return this._createErrorContainer("You cannot import invites for bots.");
    }

    try {
      const invites = await guild.invites.fetch({ cache: false });
      const tempMap = new Map();

      for (const invite of invites.values()) {
        const inviter = invite.inviter;
        if (!inviter || invite.uses === 0) continue;
        if (specificUser && inviter.id !== specificUser.id) continue;

        if (!tempMap.has(inviter.id)) {
          tempMap.set(inviter.id, invite.uses);
        } else {
          const uses = tempMap.get(inviter.id) + invite.uses;
          tempMap.set(inviter.id, uses);
        }
      }

      let totalImported = 0;
      let usersUpdated = 0;

      for (const [userId, uses] of tempMap.entries()) {
        db.importMemberInvites(guild.id, userId, uses);
        totalImported += uses;
        usersUpdated++;
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("check")} **Invites Imported**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      let message;
      if (specificUser) {
        const userInvites = tempMap.get(specificUser.id) || 0;
        message = `Successfully imported **${userInvites}** invite${userInvites !== 1 ? "s" : ""} for ${specificUser.toString()}`;
      } else {
        message = 
          `Successfully imported invites!\n\n` +
          `${emoji.get("invites")} **Total Invites Imported:** ${totalImported}\n` +
          `${emoji.get("user")} **Users Updated:** ${usersUpdated}`;
      }

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
    } catch (error) {
      return this._createErrorContainer("Failed to import invites. Make sure I have the required permissions.");
    }
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

export default new InvitesImportCommand();
