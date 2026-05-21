import { EmbedBuilder, PermissionsBitField } from "discord.js";
import emoji from "#config/emoji";

const PERM_NAMES = {
  AddReactions: "Add Reactions",
  Administrator: "Administrator",
  AttachFiles: "Attach Files",
  BanMembers: "Ban Members",
  ChangeNickname: "Change Nickname",
  Connect: "Connect",
  CreateInstantInvite: "Create Invite",
  CreatePrivateThreads: "Create Private Threads",
  CreatePublicThreads: "Create Public Threads",
  DeafenMembers: "Deafen Members",
  EmbedLinks: "Embed Links",
  KickMembers: "Kick Members",
  ManageChannels: "Manage Channels",
  ManageEmojisAndStickers: "Manage Emojis",
  ManageEvents: "Manage Events",
  ManageGuild: "Manage Server",
  ManageMessages: "Manage Messages",
  ManageNicknames: "Manage Nicknames",
  ManageRoles: "Manage Roles",
  ManageThreads: "Manage Threads",
  ManageWebhooks: "Manage Webhooks",
  MentionEveryone: "Mention Everyone",
  ModerateMembers: "Timeout Members",
  MoveMembers: "Move Members",
  MuteMembers: "Mute Members",
  PrioritySpeaker: "Priority Speaker",
  ReadMessageHistory: "Read Message History",
  RequestToSpeak: "Request to Speak",
  SendMessages: "Send Messages",
  SendMessagesInThreads: "Send in Threads",
  SendTTSMessages: "Send TTS Messages",
  Speak: "Speak",
  Stream: "Go Live",
  UseApplicationCommands: "Use Slash Commands",
  UseEmbeddedActivities: "Use Activities",
  UseExternalEmojis: "Use External Emojis",
  UseExternalStickers: "Use External Stickers",
  UseVAD: "Use Voice Activity",
  ViewAuditLog: "View Audit Log",
  ViewChannel: "View Channel",
  ViewGuildInsights: "View Server Insights",
};

export default {
  name: "permissions",
  description: "Check a member's permissions in a channel",
  usage: "permissions [@user] [#channel]",
  aliases: ["perms", "checkperms"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "permissions",
    description: "Check a member's permissions",
    options: [
      { name: "user", description: "Member to check (default: you)", type: 6, required: false },
      { name: "channel", description: "Channel to check in (default: current)", type: 7, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) || message.channel;
    return message.reply({ embeds: [buildPermsEmbed(member, channel)] });
  },

  async slashExecute({ client, interaction }) {
    const member = interaction.options.getMember("user") || interaction.member;
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    return interaction.reply({ embeds: [buildPermsEmbed(member, channel)], ephemeral: true });
  },
};

function buildPermsEmbed(member, channel) {
  const perms = channel.permissionsFor(member);
  const allPerms = Object.keys(PermissionsBitField.Flags);
  const has = [], missing = [];
  for (const perm of allPerms) {
    if (perms.has(perm)) has.push(`✅ ${PERM_NAMES[perm] || perm}`);
    else missing.push(`❌ ${PERM_NAMES[perm] || perm}`);
  }
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${emoji.get("moderation")} Permissions — ${member.user.tag}`)
    .setDescription(`In ${channel}\n\n${[...has, ...missing].slice(0, 40).join("\n")}`)
    .setTimestamp();
}
