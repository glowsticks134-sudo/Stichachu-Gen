import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const dadjokes = [
  ["Why don't scientists trust atoms?", "Because they make up everything!"],
  ["I'm reading a book about anti-gravity.", "It's impossible to put down."],
  ["Did you hear about the mathematician who's afraid of negative numbers?", "He'll stop at nothing to avoid them."],
  ["Why do cows wear bells?", "Because their horns don't work."],
  ["What do you call a fake noodle?", "An impasta!"],
  ["I used to hate facial hair...", "But then it grew on me."],
  ["Why can't you give Elsa a balloon?", "Because she'll let it go."],
  ["I told my wife she should embrace her mistakes.", "She gave me a hug."],
  ["What do you call cheese that isn't yours?", "Nacho cheese."],
  ["Why did the scarecrow win an award?", "Because he was outstanding in his field."],
  ["I only know 25 letters of the alphabet.", "I don't know y."],
  ["What do you call a sleeping dinosaur?", "A dino-snore."],
  ["Why did the bicycle fall over?", "Because it was two-tired."],
  ["What do you call an alligator in a vest?", "An investigator."],
  ["I'm on a seafood diet.", "I see food and I eat it."],
  ["Why don't eggs tell jokes?", "They'd crack each other up."],
  ["What do you call a bear with no teeth?", "A gummy bear."],
  ["I asked my dog what two minus two is.", "He said nothing."],
  ["Why can't a nose be 12 inches long?", "Because then it would be a foot."],
  ["What did the ocean say to the beach?", "Nothing, it just waved."],
  ["Why did the golfer bring extra socks?", "In case he got a hole in one."],
  ["What do you call a factory that makes okay products?", "A satisfactory."],
  ["I would avoid the sushi if I were you.", "It's a little fishy."],
  ["Why did the picture go to jail?", "Because it was framed."],
  ["What do you call a fish without eyes?", "A fsh."],
];

export default {
  name: "dadjoke",
  description: "Get a random dad joke",
  usage: "dadjoke",
  aliases: ["dad", "badjoke", "pun"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "dadjoke", description: "Get a random dad joke" },

  async execute({ client, message, args }) {
    return message.reply({ embeds: [buildEmbed(message.author)] });
  },

  async slashExecute({ client, interaction }) {
    return interaction.reply({ embeds: [buildEmbed(interaction.user)] });
  },
};

function buildEmbed(user) {
  const [setup, punchline] = dadjokes[Math.floor(Math.random() * dadjokes.length)];
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("👴 Dad Joke")
    .setDescription(`**${setup}**\n\n||${punchline}||`)
    .setFooter({ text: `Requested by ${user.username} • Hover to reveal punchline` });
}
