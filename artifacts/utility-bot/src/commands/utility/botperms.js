import { EmbedBuilder, PermissionsBitField } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "botperms",
  description: "Check what permissions the bot has in this channel",
  usage: "botperms [#channel]",
  aliases: ["myperms", "botpermissions"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "botperms",
    description: "Check the bot's permissions in this channel",
    options: [{ name: "channel", description: "Channel to check (defaults to current)", type: 7, required: false }],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first() || message.channel;
    return message.reply({ embeds: [buildEmbed(channel, message.guild.members.me)] });
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    return interaction.reply({ embeds: [buildEmbed(channel, interaction.guild.members.me)] });
  },
};

function buildEmbed(channel, botMember) {
  const perms = channel.permissionsFor(botMember);
  if (!perms) return new EmbedBuilder().setColor(0xff0000).setTitle("❌ Error").setDescription("Couldn't fetch permissions for this channel.");

  const keyPerms = [
    "ViewChannel", "SendMessages", "EmbedLinks", "AttachFiles",
    "ReadMessageHistory", "MentionEveryone", "AddReactions",
    "ManageMessages", "ManageChannels", "Connect", "Speak",
    "MuteMembers", "DeafenMembers", "MoveMembers", "Administrator"
  ];

  const lines = keyPerms.map(p => {
    const has = perms.has(PermissionsBitField.Flags[p]);
    return `${has ? "✅" : "❌"} ${p}`;
  });

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🔑 Bot Permissions in #${channel.name}`)
    .setDescription(lines.join("\n"))
    .setTimestamp();
}
