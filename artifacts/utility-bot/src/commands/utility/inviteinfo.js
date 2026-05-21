import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "inviteinfo",
  description: "Get detailed info about an invite link or code",
  usage: "inviteinfo <code or link>",
  aliases: ["invite-info", "iinfo"],
  category: "utility",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "inviteinfo",
    description: "Get info about a Discord invite code or link",
    options: [{ name: "code", description: "Invite code or link", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args[0]) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    const code = args[0].split("/").pop().split("?")[0];
    try {
      const invite = await client.fetchInvite(code);
      return message.reply({ embeds: [buildInviteEmbed(invite)] });
    } catch {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid or expired invite code.")] });
    }
  },

  async slashExecute({ client, interaction }) {
    const codeRaw = interaction.options.getString("code");
    const code = codeRaw.split("/").pop().split("?")[0];
    try {
      const invite = await client.fetchInvite(code);
      return interaction.reply({ embeds: [buildInviteEmbed(invite)] });
    } catch {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid or expired invite code.")], ephemeral: true });
    }
  },
};

function buildInviteEmbed(invite) {
  const lines = [
    `**Code:** \`${invite.code}\``,
    `**URL:** [discord.gg/${invite.code}](https://discord.gg/${invite.code})`,
    `**Uses:** ${invite.uses ?? "Unknown"}`,
    `**Max Uses:** ${invite.maxUses || "Unlimited"}`,
    `**Expires:** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : "Never"}`,
    `**Inviter:** ${invite.inviter ? `${invite.inviter.tag} (${invite.inviter.id})` : "Unknown"}`,
    `**Server:** ${invite.guild?.name || "Unknown"} (${invite.guild?.id || "?"})`,
    `**Members:** ${invite.memberCount || "?"}`,
    `**Channel:** #${invite.channel?.name || "Unknown"}`,
  ];
  return new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("inviteCode")} Invite Info`).setDescription(lines.join("\n")).setTimestamp();
}
