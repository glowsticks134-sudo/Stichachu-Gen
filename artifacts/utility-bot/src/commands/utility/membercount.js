import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "membercount",
  description: "Show a detailed breakdown of server member count",
  usage: "membercount",
  aliases: ["members", "mc"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: {
    name: "membercount",
    description: "Show the server member count breakdown",
  },

  async execute({ client, message }) {
    await message.guild.members.fetch();
    return message.reply({ embeds: [buildMembercountEmbed(message.guild)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.guild.members.fetch();
    return interaction.reply({ embeds: [buildMembercountEmbed(interaction.guild)] });
  },
};

function buildMembercountEmbed(guild) {
  const members = guild.members.cache;
  const total = guild.memberCount;
  const humans = members.filter(m => !m.user.bot).size;
  const bots = members.filter(m => m.user.bot).size;
  const online = members.filter(m => m.presence?.status === "online").size;
  const idle = members.filter(m => m.presence?.status === "idle").size;
  const dnd = members.filter(m => m.presence?.status === "dnd").size;
  const offline = total - online - idle - dnd;
  const boosters = guild.premiumSubscriptionCount || 0;

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${emoji.get("server")} Member Count — ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setDescription(
      `**Total Members:** ${total}\n` +
      `├─ **Humans:** ${humans}\n` +
      `└─ **Bots:** ${bots}\n\n` +
      `**Status:**\n` +
      `├─ 🟢 Online: ${online}\n` +
      `├─ 🌙 Idle: ${idle}\n` +
      `├─ 🔴 Do Not Disturb: ${dnd}\n` +
      `└─ ⚫ Offline: ${offline}\n\n` +
      `**Server Boost Level:** ${guild.premiumTier}\n` +
      `**Boosters:** ${boosters}`
    )
    .setTimestamp();
}
