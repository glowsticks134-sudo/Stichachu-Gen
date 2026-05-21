import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const prompts = [
  "Never have I ever lied about being busy to avoid plans.",
  "Never have I ever pulled an all-nighter gaming.",
  "Never have I ever eaten an entire pizza by myself.",
  "Never have I ever sent a text to the wrong person.",
  "Never have I ever cried watching an anime.",
  "Never have I ever been in a Discord call for over 12 hours.",
  "Never have I ever rage quit a game and unplugged the controller.",
  "Never have I ever pretended to know a song I didn't know.",
  "Never have I ever ordered way too much fast food.",
  "Never have I ever stayed up until 5am for no reason.",
  "Never have I ever been too embarrassed to ask for help.",
  "Never have I ever talked to my pet as if they understand me.",
  "Never have I ever forgotten someone's name seconds after being introduced.",
  "Never have I ever Googled myself.",
  "Never have I ever accidentally liked an old Instagram post while stalking someone.",
  "Never have I ever screamed at my WiFi router.",
  "Never have I ever cried over a fictional character's death.",
  "Never have I ever panic-purchased something I didn't need.",
  "Never have I ever pretended to laugh at a joke I didn't understand.",
  "Never have I ever talked to myself out loud.",
  "Never have I ever gone to sleep without brushing my teeth.",
  "Never have I ever binge-watched an entire series in one day.",
  "Never have I ever replied 'you too' to an awkward situation.",
  "Never have I ever joined a game lobby and immediately left.",
  "Never have I ever secretly judged someone's playlist.",
];

export default {
  name: "neverhaveiever",
  description: "Get a random 'Never Have I Ever' prompt",
  usage: "neverhaveiever",
  aliases: ["nhie", "neverhave"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "neverhaveiever", description: "Get a random Never Have I Ever prompt" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed()] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed()] });
  },
};

function buildEmbed() {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🤚 Never Have I Ever")
    .setDescription(prompt)
    .setFooter({ text: "React with ☝️ if you HAVE and 🤚 if you HAVEN'T!" })
    .setTimestamp();
}
