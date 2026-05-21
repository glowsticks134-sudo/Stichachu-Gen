import { EmbedBuilder } from "discord.js";
import emoji from "#config/emoji";

const TIMEZONES = {
  "UTC": "UTC",
  "EST": "America/New_York",
  "CST": "America/Chicago",
  "MST": "America/Denver",
  "PST": "America/Los_Angeles",
  "GMT": "Europe/London",
  "CET": "Europe/Paris",
  "IST": "Asia/Kolkata",
  "JST": "Asia/Tokyo",
  "AEST": "Australia/Sydney",
  "CST_CHINA": "Asia/Shanghai",
  "MSK": "Europe/Moscow",
  "BRT": "America/Sao_Paulo",
};

export default {
  name: "time",
  description: "Check the current time in a timezone",
  usage: "time [timezone]",
  aliases: ["clock", "worldclock", "tz"],
  category: "utility",
  cooldown: 3,
  enabledSlash: true,
  slashData: {
    name: "time",
    description: "Check the current time in a timezone",
    options: [{
      name: "timezone",
      description: "Timezone code (e.g. UTC, EST, PST, IST, JST)",
      type: 3,
      required: false,
      choices: Object.keys(TIMEZONES).slice(0, 10).map(k => ({ name: k, value: k })),
    }],
  },

  async execute({ client, message, args }) {
    const tz = args[0]?.toUpperCase() || "UTC";
    return message.reply({ embeds: [buildEmbed(tz)] });
  },

  async slashExecute({ client, interaction }) {
    const tz = interaction.options.getString("timezone") || "UTC";
    return interaction.reply({ embeds: [buildEmbed(tz)] });
  },
};

function buildEmbed(tzKey) {
  const tzName = TIMEZONES[tzKey] || tzKey;
  const allTimes = Object.entries(TIMEZONES).map(([k, tz]) => {
    try {
      const t = new Date().toLocaleString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
      return `**${k}:** ${t}`;
    } catch { return null; }
  }).filter(Boolean);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🕐 World Clock")
    .setDescription(allTimes.join("\n"))
    .setFooter({ text: `All times as of right now` })
    .setTimestamp();
}
