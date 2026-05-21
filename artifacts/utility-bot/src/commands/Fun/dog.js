import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";
import https from "https";

export default {
  name: "dog",
  description: "Get a random dog image",
  usage: "dog",
  aliases: ["doggo", "woof", "puppy"],
  category: "Fun",
  cooldown: 5,
  enabledSlash: true,
  slashData: { name: "dog", description: "Get a random dog image 🐶" },

  async execute({ client, message, args }) {
    const url = await fetchDog();
    return message.reply({ embeds: [buildEmbed(url)] });
  },

  async slashExecute({ client, interaction }) {
    await interaction.deferReply();
    const url = await fetchDog();
    return interaction.editReply({ embeds: [buildEmbed(url)] });
  },
};

function fetchDog() {
  return new Promise((resolve) => {
    https.get("https://dog.ceo/api/breeds/image/random", res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try { resolve(JSON.parse(data).message || "https://placedog.net/500"); }
        catch { resolve("https://placedog.net/500"); }
      });
    }).on("error", () => resolve("https://placedog.net/500"));
  });
}

function buildEmbed(url) {
  return new EmbedBuilder()
    .setColor(0xa0522d)
    .setTitle("🐶 Random Dog!")
    .setImage(url)
    .setFooter({ text: "Powered by dog.ceo" });
}
