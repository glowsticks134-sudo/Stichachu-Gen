import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "color",
  description: "Get information about a color from a hex code",
  usage: "color <#hexcode or hexcode>",
  aliases: ["colour", "hex", "colorinfo"],
  category: "utility",
  cooldown: 5,
  enabledSlash: true,
  slashData: {
    name: "color",
    description: "Get info about a hex color",
    options: [{ name: "hex", description: "Hex color code (e.g. #ff5733 or ff5733)", type: 3, required: true }],
  },

  async execute({ client, message, args }) {
    const input = args[0];
    if (!input) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    const result = parseColor(input);
    if (!result) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid hex color. Use format `#ff5733` or `ff5733`.")] });
    return message.reply({ embeds: [buildColorEmbed(result)] });
  },

  async slashExecute({ client, interaction }) {
    const input = interaction.options.getString("hex");
    const result = parseColor(input);
    if (!result) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid hex color.")], ephemeral: true });
    return interaction.reply({ embeds: [buildColorEmbed(result)] });
  },
};

function parseColor(input) {
  const hex = input.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const hsl = rgbToHsl(r, g, b);
  return { hex: `#${hex.toUpperCase()}`, r, g, b, hsl, int: parseInt(hex, 16) };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function buildColorEmbed({ hex, r, g, b, hsl, int }) {
  return new EmbedBuilder()
    .setColor(int)
    .setTitle(`🎨 Color Info — ${hex}`)
    .setDescription(
      `**Hex:** \`${hex}\`\n` +
      `**RGB:** \`rgb(${r}, ${g}, ${b})\`\n` +
      `**HSL:** \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\`\n` +
      `**Decimal:** \`${int}\`\n` +
      `**Preview:** The embed color above is this color`
    )
    .setTimestamp();
}
