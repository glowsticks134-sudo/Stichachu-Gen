import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "ship",
  description: "Ship two users and see their compatibility score",
  usage: "ship <@user1> <@user2>",
  aliases: ["love", "lovemeter"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "ship",
    description: "Ship two users together",
    options: [
      { name: "user1", description: "First person", type: 6, required: true },
      { name: "user2", description: "Second person", type: 6, required: true },
    ],
  },

  async execute({ client, message, args }) {
    const user1 = message.mentions.users.first();
    const user2 = message.mentions.users.at ? message.mentions.users.map(u => u)[1] : null;
    if (!user1 || !user2) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention two users.")] });
    return message.reply({ embeds: [buildShipEmbed(user1, user2)] });
  },

  async slashExecute({ client, interaction }) {
    const user1 = interaction.options.getUser("user1");
    const user2 = interaction.options.getUser("user2");
    return interaction.reply({ embeds: [buildShipEmbed(user1, user2)] });
  },
};

function buildShipEmbed(u1, u2) {
  const seed = (BigInt(u1.id) + BigInt(u2.id)) % 101n;
  const score = Number(seed);
  const bar = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
  let label, color;
  if (score >= 85) { label = "💞 Soulmates!"; color = 0xff1493; }
  else if (score >= 70) { label = "❤️ Great Match!"; color = 0xff4500; }
  else if (score >= 50) { label = "💛 Pretty Good"; color = 0xffd700; }
  else if (score >= 30) { label = "💙 Could Work"; color = 0x1e90ff; }
  else { label = "💔 Incompatible"; color = 0x808080; }
  const shipName = u1.username.slice(0, Math.ceil(u1.username.length / 2)) + u2.username.slice(Math.floor(u2.username.length / 2));
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji.get("couple")} Ship Meter`)
    .setDescription(`**${u1.tag}** ❤️ **${u2.tag}**\n\n**Ship Name:** ${shipName}\n\n\`[${bar}]\` **${score}%**\n\n**${label}**`);
}
