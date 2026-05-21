import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "timestamp",
  description: "Generate Discord timestamps from a date/time",
  usage: "timestamp <date/time string>",
  aliases: ["time", "ts"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "timestamp",
    description: "Generate all Discord timestamp formats for a date",
    options: [
      { name: "date", description: "Date string (e.g. 2025-12-25, or 'tomorrow', 'next friday')", type: 3, required: true },
      { name: "time", description: "Time (e.g. 15:00, 3pm)", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    if (!args.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    const parsed = new Date(args.join(" "));
    if (isNaN(parsed.getTime())) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid date. Try formats like `2025-12-25`, `December 25 2025`.")] });
    return message.reply({ embeds: [buildTimestampEmbed(parsed)] });
  },

  async slashExecute({ client, interaction }) {
    const dateStr = interaction.options.getString("date");
    const timeStr = interaction.options.getString("time") || "";
    const parsed = new Date(`${dateStr} ${timeStr}`.trim());
    if (isNaN(parsed.getTime())) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Invalid date/time.")], ephemeral: true });
    return interaction.reply({ embeds: [buildTimestampEmbed(parsed)] });
  },
};

function buildTimestampEmbed(date) {
  const unix = Math.floor(date.getTime() / 1000);
  const formats = [
    { label: "Short Time", format: `:t`, example: `<t:${unix}:t>` },
    { label: "Long Time", format: `:T`, example: `<t:${unix}:T>` },
    { label: "Short Date", format: `:d`, example: `<t:${unix}:d>` },
    { label: "Long Date", format: `:D`, example: `<t:${unix}:D>` },
    { label: "Short Date/Time", format: `:f`, example: `<t:${unix}:f>` },
    { label: "Long Date/Time", format: `:F`, example: `<t:${unix}:F>` },
    { label: "Relative", format: `:R`, example: `<t:${unix}:R>` },
  ];

  const description = formats.map(f => `**${f.label}:** ${f.example} → \`<t:${unix}${f.format}>\``).join("\n");
  return new EmbedBuilder().setColor(0x5865f2).setTitle(`${emoji.get("timer")} Discord Timestamps`).setDescription(`**Unix:** \`${unix}\`\n\n${description}`);
}
