import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "unbanall",
  description: "Unban all banned users from the server",
  usage: "unbanall",
  aliases: ["massunban"],
  category: "moderation",
  cooldown: 30,
  userPermissions: [PermissionFlagsBits.Administrator],
  permissions: [PermissionFlagsBits.BanMembers],
  enabledSlash: true,
  slashData: { name: "unbanall", description: "Unban all banned users from this server" },

  async execute({ client, message, args }) {
    try {
      const bans = await message.guild.bans.fetch();

      if (bans.size === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("info")} No Bans`)
          .setDescription("There are no banned users in this server.");

        return message.reply({ embeds: [embed] });
      }

      const loadingEmbed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("loading")} Unbanning Users...`)
        .setDescription(`Unbanning ${bans.size} users. This may take a while...`);

      const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

      let unbanned = 0;
      let failed = 0;

      for (const [userId] of bans) {
        try {
          await message.guild.members.unban(userId, `Mass unban by ${message.author.tag}`);
          unbanned++;
        } catch {
          failed++;
        }
      }

      const supportButton = new ButtonBuilder()
        .setLabel("Support")
        .setURL(config.links.supportServer)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(supportButton);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("unban")} Mass Unban Complete`)
        .setDescription(
          `**Unbanned:** ${unbanned} users\n` +
          `**Failed:** ${failed} users\n` +
          `**Moderator:** ${message.author.tag}`
        );

      return loadingMsg.edit({ embeds: [embed], components: [row] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Unban All Failed`)
        .setDescription(`Failed to unban all users: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const bans = await interaction.guild.bans.fetch();
    if (!bans.size) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} No Bans`).setDescription("There are no banned users.")] });
    let unbanned = 0, failed = 0;
    for (const [id] of bans) {
      await interaction.guild.members.unban(id).then(() => unbanned++).catch(() => failed++);
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("unban")} Mass Unban Complete`).setDescription(`**Unbanned:** ${unbanned}\n**Failed:** ${failed}`)] });
  },
};
