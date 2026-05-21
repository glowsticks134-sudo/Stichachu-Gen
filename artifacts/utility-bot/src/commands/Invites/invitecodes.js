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

class InviteCodesCommand extends Command {
  constructor() {
    super({
      name: "invitecodes",
      description: "List all your invite codes in this guild",
      usage: "invitecodes [@member]",
      aliases: ["codes", "mycodes"],
      category: "Invites",
      examples: [
        "invitecodes",
        "invitecodes @user",
      ],
      cooldown: 5,
      permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "invitecodes",
        description: "List all invite codes for a user",
        options: [
          {
            name: "user",
            description: "The user to get invite codes for",
            type: 6,
            required: false,
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    const target = message.mentions.members.first() || message.member;
    const response = await this._getInviteCodes(message.guild, target.user);
    return message.reply(response);
  }

  async slashExecute({ client, interaction }) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await this._getInviteCodes(interaction.guild, user);
    return interaction.reply(response);
  }

  async _getInviteCodes(guild, user) {
    try {
      const invites = await guild.invites.fetch({ cache: false });
      const userInvites = invites.filter((inv) => inv.inviter?.id === user.id);

      if (userInvites.size === 0) {
        return this._createErrorContainer(`\`${user.username}\` has no invite codes in this server.`);
      }

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("inviteCode")} **Invite Codes for ${user.username}**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      let codesList = "";
      userInvites.forEach((inv) => {
        codesList += `${emoji.get("link")} [\`${inv.code}\`](${inv.url}) - ${emoji.get("uses")} **${inv.uses}** uses\n`;
      });

      const content =
        `**Total Codes:** ${userInvites.size}\n\n` +
        codesList;

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      return {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      };
    } catch (error) {
      return this._createErrorContainer("Failed to fetch invite codes. Make sure I have the required permissions.");
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

export default new InviteCodesCommand();
