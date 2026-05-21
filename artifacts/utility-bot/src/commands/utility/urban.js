import { EmbedBuilder } from "discord.js";
import https from "https";
import emoji from "#config/emoji";

export default {
  name: "urban",
  description: "Look up a word or phrase on Urban Dictionary",
  usage: "urban <word>",
  aliases: ["ud", "define", "urbandictionary"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "urban",
    description: "Look up a word on Urban Dictionary",
    options: [{ name: "word", description: "Word or phrase to look up", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ content: `${emoji.get("cross")} Please provide a word to look up!` });
    const word = args.join(" ");
    const data = await fetchUrban(word);
    return message.reply({ embeds: [buildEmbed(word, data)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const word = interaction.options.getString("word");
    const data = await fetchUrban(word);
    return interaction.editReply({ embeds: [buildEmbed(word, data)] });
  },
};

function fetchUrban(term) {
  return new Promise(resolve => {
    https.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`, res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

function clean(str) {
  return str.replace(/\[([^\]]+)\]/g, "$1").slice(0, 600);
}

function buildEmbed(word, data) {
  if (!data || !data.list?.length) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`${emoji.get("cross")} Not Found`)
      .setDescription(`No results found for **${word}** on Urban Dictionary.`);
  }
  const entry = data.list[0];
  return new EmbedBuilder()
    .setColor(0x1d2439)
    .setTitle(`📖 ${entry.word}`)
    .setURL(entry.permalink)
    .setDescription(clean(entry.definition))
    .addFields({ name: "Example", value: entry.example ? clean(entry.example) : "*No example*" })
    .setFooter({ text: `👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down} | by ${entry.author}` })
    .setTimestamp(new Date(entry.written_on));
}
