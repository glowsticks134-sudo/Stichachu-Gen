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

class InviteRanksCommand extends Command {
  constructor() {
    super({
      name: "inviteranks",
      description: "Shows all configured invite ranks",
      usage: "inviteranks",
      aliases: ["invranks", "listinviteranks"],
      category: "Invites",
      examples: ["inviteranks"],
      cooldown: 5,
      permissions: [PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "inviteranks",
        description: "Shows all configured invite ranks",
      },
    });
  }

  async execute({ client, message, args }) {
    const response = await this._getInviteRanks(message.guild);
    return message.reply(response);
  }

  async slashExecute({ client, interaction }) {
    const response = await this._getInviteRanks(interaction.guild);
    return interaction.reply(response);
  }

  async _getInviteRanks(guild) {
    const ranks = db.getInviteRanks(guild.id);

    if (ranks.length === 0) {
      return this._createErrorContainer("No invite ranks configured in this server.\n\nUse `inviterank add <role> <invites>` to add one.");
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("inviteRank")} **Invite Ranks**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    let ranksList = "";
    for (const rank of ranks) {
      const role = guild.roles.cache.get(rank.role_id);
      if (role) {
        ranksList += `${emoji.get("role")} ${role.toString()} - **${rank.invites_required}** invites\n`;
      }
    }

    if (!ranksList) {
      return this._createErrorContainer("No valid invite ranks found. Some roles may have been deleted.");
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Total Ranks:** ${ranks.length}\n\n` + ranksList
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `*Use \`inviterank add/remove\` to manage ranks*`
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
        `${emoji.get("info")} **Invite Ranks**`
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

export default new InviteRanksCommand();
