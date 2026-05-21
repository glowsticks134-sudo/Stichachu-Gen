import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import emoji from "#config/emoji";

const QUESTIONS = [
  ["Have the ability to fly", "Be able to breathe underwater"],
  ["Always be 10 minutes late", "Always be 20 minutes early"],
  ["Live without music", "Live without TV and movies"],
  ["Be the funniest person in the room", "Be the smartest person in the room"],
  ["Have unlimited money but be hated by everyone", "Have limited money but loved by everyone"],
  ["Be able to read minds", "Be able to see the future"],
  ["Never use social media again", "Never watch Netflix/YouTube again"],
  ["Know how you'll die", "Know when you'll die"],
  ["Always be too hot", "Always be too cold"],
  ["Be famous but poor", "Be rich but unknown"],
  ["Speak every language", "Play every instrument"],
  ["Have super strength", "Have super speed"],
  ["Live in the past", "Live in the future"],
  ["Have a rewind button for life", "Have a pause button for life"],
  ["Give up your phone for a year", "Give up your best friend for a year"],
  ["Never lose your keys", "Never run out of battery"],
  ["Be 4'5\"", "Be 7'7\""],
  ["Always speak your mind", "Never speak again"],
  ["Have 10 fingers on one hand", "Have no fingers but perfect toes"],
  ["Win the lottery", "Live twice as long"],
];

export default {
  name: "wouldyourather",
  description: "Get a random Would You Rather question",
  usage: "wouldyourather",
  aliases: ["wyr", "would"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "wouldyourather", description: "Get a Would You Rather question" },

  async execute({ client, message }) {
    const [a, b] = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("wyr_a").setLabel("🅰️ Option A").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("wyr_b").setLabel("🅱️ Option B").setStyle(ButtonStyle.Danger),
    );
    const embed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("game")} Would You Rather...`).setDescription(`**🅰️ ${a}**\n\n**OR**\n\n**🅱️ ${b}**`);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const votes = { a: 0, b: 0, voters: new Set() };
    const collector = msg.createMessageComponentCollector({ time: 60000 });
    collector.on("collect", async i => {
      if (votes.voters.has(i.user.id)) return i.reply({ content: "You already voted!", ephemeral: true });
      votes.voters.add(i.user.id);
      if (i.customId === "wyr_a") votes.a++;
      else votes.b++;
      const total = votes.a + votes.b;
      const pctA = total ? Math.round((votes.a / total) * 100) : 0;
      const pctB = 100 - pctA;
      const newEmbed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("game")} Would You Rather...`).setDescription(`**🅰️ ${a}** — ${votes.a} votes (${pctA}%)\n\n**OR**\n\n**🅱️ ${b}** — ${votes.b} votes (${pctB}%)\n\n*${total} total votes*`);
      await i.update({ embeds: [newEmbed] });
    });
    collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  },

  async slashExecute({ client, interaction }) {
    const [a, b] = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("wyr_a").setLabel("🅰️ Option A").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("wyr_b").setLabel("🅱️ Option B").setStyle(ButtonStyle.Danger),
    );
    const embed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("game")} Would You Rather...`).setDescription(`**🅰️ ${a}**\n\n**OR**\n\n**🅱️ ${b}**`);
    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();
    const votes = { a: 0, b: 0, voters: new Set() };
    const collector = msg.createMessageComponentCollector({ time: 60000 });
    collector.on("collect", async i => {
      if (votes.voters.has(i.user.id)) return i.reply({ content: "You already voted!", ephemeral: true });
      votes.voters.add(i.user.id);
      if (i.customId === "wyr_a") votes.a++;
      else votes.b++;
      const total = votes.a + votes.b;
      const pctA = total ? Math.round((votes.a / total) * 100) : 0;
      const pctB = 100 - pctA;
      const newEmbed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("game")} Would You Rather...`).setDescription(`**🅰️ ${a}** — ${votes.a} votes (${pctA}%)\n\n**OR**\n\n**🅱️ ${b}** — ${votes.b} votes (${pctB}%)\n\n*${total} total votes*`);
      await i.update({ embeds: [newEmbed] });
    });
    collector.on("end", () => interaction.editReply({ components: [] }).catch(() => {}));
  },
};
