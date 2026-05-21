import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "serverroles",
  description: "List all roles in the server with their member counts",
  usage: "serverroles",
  aliases: ["roles", "rolelist", "allroles"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "serverroles", description: "List all server roles" },

  async execute({ client, message }) {
    await message.guild.members.fetch();
    return message.reply({ embeds: [buildEmbed(message.guild)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.guild.members.fetch();
    return interaction.reply({ embeds: [buildEmbed(interaction.guild)] });
  },
};

function buildEmbed(guild) {
  const roles = guild.roles.cache
    .filter(r => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => `${r} — **${r.members.size}** members`)
    .slice(0, 25);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${emoji.get("role")} Roles in ${guild.name}`)
    .setDescription(roles.join("\n") || "No roles found.")
    .setFooter({ text: `${guild.roles.cache.size - 1} total roles` })
    .setTimestamp();
}
