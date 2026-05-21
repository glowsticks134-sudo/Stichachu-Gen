import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";
import https from "https";

export default {
  name: "cat",
  description: "Get a random cat image",
  usage: "cat",
  aliases: ["kitty", "meow", "kitten"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "cat", description: "Get a random cat image 🐱" },

  async execute({ client, message, args }) {
    const url = await fetchCat();
    return message.reply({ embeds: [buildEmbed(url)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const url = await fetchCat();
    return interaction.editReply({ embeds: [buildEmbed(url)] });
  },
};

function fetchCat() {
  return new Promise((resolve) => {
    https.get("https://api.thecatapi.com/v1/images/search", res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try { resolve(JSON.parse(data)[0]?.url || "https://cataas.com/cat"); }
        catch { resolve("https://cataas.com/cat"); }
      });
    }).on("error", () => resolve("https://cataas.com/cat"));
  });
}

function buildEmbed(url) {
  return new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle("🐱 Random Cat!")
    .setImage(url)
    .setFooter({ text: "Powered by thecatapi.com" });
}
