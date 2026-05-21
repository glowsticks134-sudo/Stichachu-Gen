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

class AddInvitesCommand extends Command {
  constructor() {
    super({
      name: "addinvites",
      description: "Add invites to a member",
      usage: "addinvites <@member> <amount>",
      aliases: ["addinv", "bonus-invites"],
      category: "Invites",
      examples: [
        "addinvites @user 10",
        "addinvites @user -5",
      ],
      cooldown: 5,
      userPermissions: [PermissionFlagsBits.ManageGuild],
      permissions: [PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "addinvites",
        description: "Add invites to a member",
        options: [
          {
            name: "user",
            description: "The user to add invites to",
            type: 6,
            required: true,
          },
          {
            name: "invites",
            description: "The number of invites to add (can be negative)",
            type: 4,
            required: true,
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    const target = message.mentions.members.first();
    const amount = parseInt(args[1]);

    if (!target) {
      return message.reply(this._createErrorContainer("Please mention a user to add invites to."));
    }

    if (isNaN(amount)) {
      return message.reply(this._createErrorContainer("Please provide a valid number of invites."));
    }

    const response = await this._addInvites(message.guild, target.user, amount);
    return message.reply(response);
  }

  async slashExecute({ client, interaction }) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("invites");

    const response = await this._addInvites(interaction.guild, user, amount);
    return interaction.reply(response);
  }

  async _addInvites(guild, user, amount) {
    if (user.bot) {
      return this._createErrorContainer("You cannot add invites to bots.");
    }

    const memberData = db.addInvitesToMember(guild.id, user.id, amount);
    const effectiveInvites = db.getEffectiveInvites(memberData);

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.get("check")} **Invites Added**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const action = amount >= 0 ? "added to" : "removed from";
    const absAmount = Math.abs(amount);

    const content =
      `Successfully ${action === "added to" ? "added" : "removed"} **${absAmount}** invite${absAmount !== 1 ? "s" : ""} ${action} ${user.toString()}\n\n` +
      `${emoji.get("invites")} **Current Invites:** ${effectiveInvites}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
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

export default new AddInvitesCommand();
