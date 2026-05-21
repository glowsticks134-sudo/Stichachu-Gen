import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "announce",
  description: "Send an announcement embed to a channel",
  usage: "announce <#channel> <title> | <message>",
  aliases: ["announcement", "ann"],
  category: "moderation",
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  enabledSlash: true,
  slashData: {
    name: "announce",
    description: "Send an announcement to a channel",
    options: [
      { name: "channel", description: "Channel to announce in", type: 7, required: true },
      { name: "title", description: "Announcement title", type: 3, required: true },
      { name: "message", description: "Announcement content", type: 3, required: true },
      { name: "color", description: "Embed color (hex, default: gold)", type: 3, required: false },
      { name: "mention", description: "Role or everyone/here to mention", type: 8, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please mention a channel.")] });
    const content = args.slice(1).join(" ");
    if (!content) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide announcement content.")] });
    const [title, ...body] = content.split("|").map(s => s.trim());
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`📢 ${title}`)
      .setDescription(body.join("\n") || title)
      .setFooter({ text: `Announced by ${message.author.tag}` })
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Announcement Sent`).setDescription(`Your announcement has been sent to ${channel}.`)] });
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel");
    const title = interaction.options.getString("title");
    const content = interaction.options.getString("message");
    const colorStr = interaction.options.getString("color");
    const mentionRole = interaction.options.getRole("mention");
    let color = 0xffd700;
    if (colorStr) {
      const parsed = parseInt(colorStr.replace("#", ""), 16);
      if (!isNaN(parsed)) color = parsed;
    }
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📢 ${title}`)
      .setDescription(content)
      .setFooter({ text: `Announced by ${interaction.user.tag}` })
      .setTimestamp();
    const sendOptions = { embeds: [embed] };
    if (mentionRole) sendOptions.content = `${mentionRole}`;
    await channel.send(sendOptions);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Announcement Sent`).setDescription(`Announcement sent to ${channel}.`)], ephemeral: true });
  },
};
