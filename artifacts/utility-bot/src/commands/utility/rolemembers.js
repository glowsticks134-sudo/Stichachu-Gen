import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "rolemembers",
  description: "List all members that have a specific role",
  usage: "rolemembers <@role>",
  aliases: ["inrole", "memberswithrole", "whohas"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: {
    name: "rolemembers",
    description: "List members with a specific role",
    options: [{ name: "role", description: "The role to check", type: 8, required: true }],
  },

  async execute({ client, message, args }) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a valid role.")] });
    await message.guild.members.fetch();
    return message.reply({ embeds: [buildRoleMembersEmbed(role)] });
  },

  async slashExecute({ client, interaction }) {
    const role = interaction.options.getRole("role");
    await interaction.guild.members.fetch();
    return interaction.reply({ embeds: [buildRoleMembersEmbed(role)] });
  },
};

function buildRoleMembersEmbed(role) {
  const members = role.members;
  if (!members.size) {
    return new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("role")} ${role.name} Members`).setDescription("No members have this role.");
  }
  const memberList = members.map(m => m.user.tag).sort();
  const chunks = [];
  for (let i = 0; i < memberList.length; i += 30) chunks.push(memberList.slice(i, i + 30));
  const display = chunks[0].join("\n");
  const extra = memberList.length > 30 ? `\n*...and ${memberList.length - 30} more*` : "";
  return new EmbedBuilder()
    .setColor(role.color || 0x5865f2)
    .setTitle(`${emoji.get("role")} Members with ${role.name}`)
    .setDescription(`**Total:** ${members.size}\n\n${display}${extra}`)
    .setTimestamp();
}
