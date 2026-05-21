import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "boosts",
  description: "Show server boost information and all boosters",
  usage: "boosts",
  aliases: ["boosters", "serverboost", "premiuminfo"],
  category: "utility",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "boosts", description: "Show server boost info and boosters" },

  async execute({ client, message, args }) {
    await message.guild.members.fetch();
    return message.reply({ embeds: [buildEmbed(message.guild)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.guild.members.fetch();
    return interaction.reply({ embeds: [buildEmbed(interaction.guild)] });
  },
};

function buildEmbed(guild) {
  const boosters = guild.members.cache
    .filter(m => m.premiumSince)
    .sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp);

  const tierNames = { 0: "None", 1: "Level 1", 2: "Level 2", 3: "Level 3" };
  const boosterList = boosters.size
    ? boosters.map(m => `${m.user.username} — since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`).slice(0, 20).join("\n")
    : "*No boosters*";

  return new EmbedBuilder()
    .setColor(0xff73fa)
    .setTitle(`🚀 Server Boosts — ${guild.name}`)
    .addFields(
      { name: "Boost Level", value: tierNames[guild.premiumTier] || "None", inline: true },
      { name: "Total Boosts", value: guild.premiumSubscriptionCount?.toString() || "0", inline: true },
      { name: "Boosters", value: boosters.size.toString(), inline: true },
    )
    .setDescription(boosterList + (boosters.size > 20 ? `\n*...and ${boosters.size - 20} more*` : ""))
    .setTimestamp();
}
