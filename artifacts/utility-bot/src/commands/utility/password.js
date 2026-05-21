import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "password",
  description: "Generate a secure random password",
  usage: "password [length]",
  aliases: ["genpassword", "generatepassword", "passgen"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "password",
    description: "Generate a secure random password",
    options: [{ name: "length", description: "Password length (8-64, default 16)", type: 4, required: false, min_value: 8, max_value: 64 }],
  },

  async execute({ client, message, args }) {
    const len = Math.min(64, Math.max(8, parseInt(args[0]) || 16));
    const pw = generate(len);
    try {
      await message.author.send({ embeds: [buildEmbed(pw, len)] });
      await message.reply({ content: `${emoji.get("check")} Password sent to your DMs!` });
    } catch {
      await message.reply({ embeds: [buildEmbed(pw, len)], ephemeral: true }).catch(() => message.reply({ content: `${emoji.get("cross")} Couldn't DM you — enable DMs and try again.` }));
    }
  },

  async slashExecute({ client, interaction }) {
    const len = interaction.options.getInteger("length") || 16;
    const pw = generate(len);
    return interaction.reply({ embeds: [buildEmbed(pw, len)], ephemeral: true });
  },
};

function generate(len) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildEmbed(pw, len) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("🔑 Generated Password")
    .setDescription(`\`\`\`${pw}\`\`\``)
    .addFields({ name: "Length", value: `${len} characters`, inline: true })
    .setFooter({ text: "Keep this password safe! Never share it." });
}
