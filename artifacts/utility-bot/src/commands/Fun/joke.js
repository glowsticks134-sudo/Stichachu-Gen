import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "I told my wife she was drawing her eyebrows too high.", punchline: "She looked surprised." },
  { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field." },
  { setup: "Why don't eggs tell jokes?", punchline: "Because they'd crack each other up!" },
  { setup: "I'm reading a book about anti-gravity.", punchline: "It's impossible to put down." },
  { setup: "Did you hear about the mathematician who's afraid of negative numbers?", punchline: "He'll stop at nothing to avoid them." },
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "How do you organize a space party?", punchline: "You planet." },
  { setup: "I only know 25 letters of the alphabet.", punchline: "I don't know why." },
  { setup: "What do you call a fake noodle?", punchline: "An impasta." },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she'll let it go." },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved." },
  { setup: "Why can't a bicycle stand on its own?", punchline: "Because it's two-tired." },
  { setup: "I told a joke about construction.", punchline: "I'm still working on it." },
  { setup: "Why did the invisible man turn down the job offer?", punchline: "He couldn't see himself doing it." },
];

export default {
  name: "joke",
  description: "Get a random joke",
  usage: "joke",
  aliases: ["lol", "haha", "laugh"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "joke", description: "Get a random joke" },

  async execute({ client, message }) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    const msg = await message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle(`${emoji.get("fun")} Joke`).setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)] });
    return msg;
  },

  async slashExecute({ client, interaction }) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle(`${emoji.get("fun")} Joke`).setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)] });
  },
};
