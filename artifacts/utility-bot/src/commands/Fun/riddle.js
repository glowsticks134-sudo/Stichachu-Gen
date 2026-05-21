import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import emoji from "#config/emoji";

const RIDDLES = [
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "An echo" },
  { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
  { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
  { q: "I can fly without wings. I can be caught but not thrown. What am I?", a: "Time" },
  { q: "I have hands but cannot clap. What am I?", a: "A clock" },
  { q: "What has to be broken before you can use it?", a: "An egg" },
  { q: "I'm light as a feather, but even the strongest person can't hold me for 5 minutes. What am I?", a: "Breath" },
  { q: "What begins with T, ends with T, and has T in it?", a: "A teapot" },
  { q: "I have a head and a tail but no body. What am I?", a: "A coin" },
  { q: "What gets wetter the more it dries?", a: "A towel" },
  { q: "I start with an E, end with an E, but usually contain only one letter. What am I?", a: "An envelope" },
  { q: "The more you take away from me, the bigger I get. What am I?", a: "A hole" },
  { q: "What has keys but no locks, space but no room, and you can enter but can't go inside?", a: "A keyboard" },
  { q: "I go up but never come down. What am I?", a: "Your age" },
  { q: "I'm always in front of you but can never be seen. What am I?", a: "The future" },
];

export default {
  name: "riddle",
  description: "Get a random riddle — try to solve it!",
  usage: "riddle",
  aliases: ["brain", "puzzle"],
  category: "Fun",
  cooldown: 10,
  enabledSlash: true,
  slashData: { name: "riddle", description: "Get a random riddle" },

  async execute({ client, message }) {
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("riddle_reveal").setLabel("Reveal Answer 🔍").setStyle(ButtonStyle.Secondary),
    );
    const embed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("sparkle")} Riddle`).setDescription(`**${riddle.q}**\n\n*Click the button to reveal the answer!*`);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 120000 });
    collector.on("collect", async i => {
      const revealEmbed = new EmbedBuilder().setColor(0x00ff00).setTitle(`${emoji.get("sparkle")} Riddle — Revealed!`).setDescription(`**${riddle.q}**\n\n✅ **Answer:** ${riddle.a}`);
      await i.update({ embeds: [revealEmbed], components: [] });
      collector.stop();
    });
    collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  },

  async slashExecute({ client, interaction }) {
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("riddle_reveal").setLabel("Reveal Answer 🔍").setStyle(ButtonStyle.Secondary),
    );
    const embed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`${emoji.get("sparkle")} Riddle`).setDescription(`**${riddle.q}**\n\n*Click to reveal the answer!*`);
    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 120000 });
    collector.on("collect", async i => {
      const revealEmbed = new EmbedBuilder().setColor(0x00ff00).setTitle(`${emoji.get("sparkle")} Riddle — Revealed!`).setDescription(`**${riddle.q}**\n\n✅ **Answer:** ${riddle.a}`);
      await i.update({ embeds: [revealEmbed], components: [] });
      collector.stop();
    });
    collector.on("end", () => interaction.editReply({ components: [] }).catch(() => {}));
  },
};
