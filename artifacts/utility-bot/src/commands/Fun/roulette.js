import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const chambers = 6;

export default {
  name: "roulette",
  description: "Play Russian Roulette — are you lucky?",
  usage: "roulette",
  aliases: ["russianroulette", "spin", "shoot"],
  category: "Fun",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "roulette", description: "Play Russian Roulette — are you lucky?" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed(message.author)] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed(interaction.user)] });
  },
};

function buildEmbed(user) {
  const shot = Math.floor(Math.random() * chambers) === 0;
  if (shot) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔫 BANG!")
      .setDescription(`**${user.username}** pulled the trigger and... **BANG!** 💀\nYou were unlucky. Better luck next life!`)
      .setFooter({ text: "1/6 chance — you hit it!" });
  }
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("🔫 *click*")
    .setDescription(`**${user.username}** pulled the trigger and... *click*. You survived! 😅\nThe chamber was empty — you live to spin again!`)
    .setFooter({ text: `${chambers - 1}/6 chance — you survived!` });
}
