import { EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "voicemove",
  description: "Move a member (or all members) to a different voice channel",
  usage: "voicemove <@user|all> <#voice-channel>",
  aliases: ["vmove", "vc-move"],
  category: "moderation",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.MoveMembers],
  permissions: [PermissionFlagsBits.MoveMembers],
  enabledSlash: true,
  slashData: {
    name: "voicemove",
    description: "Move a member to another voice channel",
    options: [
      { name: "user", description: "The member to move", type: 6, required: true },
      { name: "channel", description: "Destination voice channel", type: 7, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const moveAll = args[0]?.toLowerCase() === "all";
    const targetChannel = message.guild.channels.cache.get(args[moveAll ? 1 : 1]?.replace(/[<#>]/g, "")) ||
      message.guild.channels.cache.find(c => c.name === args[moveAll ? 1 : 1] && c.type === ChannelType.GuildVoice);

    if (moveAll) {
      const voiceChannel = message.member.voice?.channel;
      if (!voiceChannel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("You must be in a voice channel to move all.")] });
      if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a valid voice channel.")] });
      let moved = 0;
      for (const [, member] of voiceChannel.members) {
        await member.voice.setChannel(targetChannel).catch(() => {});
        moved++;
      }
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Moved All`).setDescription(`Moved **${moved}** members to ${targetChannel}.`)] });
    }

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")] });
    if (!target.voice.channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("That member is not in a voice channel.")] });
    const dest = message.mentions.channels.last() || targetChannel;
    if (!dest || dest.type !== ChannelType.GuildVoice) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a valid voice channel.")] });
    try {
      await target.voice.setChannel(dest);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Member Moved`).setDescription(`**${target.user.tag}** has been moved to ${dest}.`)] });
    } catch (err) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)] });
    }
  },

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    const dest = interaction.options.getChannel("channel");
    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member not found.")], ephemeral: true });
    if (!target.voice.channel) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Member is not in a voice channel.")], ephemeral: true });
    if (dest.type !== ChannelType.GuildVoice) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please select a voice channel.")], ephemeral: true });
    try {
      await target.voice.setChannel(dest);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Member Moved`).setDescription(`**${target.user.tag}** moved to ${dest}.`)] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription(err.message)], ephemeral: true });
    }
  },
};
