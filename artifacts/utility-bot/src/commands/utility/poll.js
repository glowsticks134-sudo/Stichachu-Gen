import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

const EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default {
  name: "poll",
  description: "Create a poll with up to 10 options",
  usage: "poll <question> | <option1> | <option2> ...",
  aliases: ["vote", "survey"],
  category: "utility",
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  enabledSlash: true,
  slashData: {
    name: "poll",
    description: "Create a poll (use | to separate question and options)",
    options: [
      { name: "content", description: "Question | Option1 | Option2 | ...", type: 3, required: true },
      { name: "channel", description: "Channel to post poll (default: current)", type: 7, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const content = args.join(" ");
    const parts = content.split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription("Use: `poll Question | Option1 | Option2 | ...`")] });
    const [question, ...options] = parts;
    if (options.length > 10) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Maximum 10 options allowed.")] });

    const description = options.map((opt, i) => `${EMOJIS[i]} ${opt}`).join("\n\n");
    const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`📊 ${question}`).setDescription(description).setFooter({ text: `Poll by ${message.author.tag}` }).setTimestamp();
    const pollMsg = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < options.length; i++) await pollMsg.react(EMOJIS[i]).catch(() => {});
    if (message.deletable) await message.delete().catch(() => {});
  },

  async slashExecute({ client, interaction }) {
    const content = interaction.options.getString("content");
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    const parts = content.split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription("Format: `Question | Option1 | Option2`")], ephemeral: true });
    const [question, ...options] = parts;
    if (options.length > 10) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Max 10 options.")], ephemeral: true });
    const description = options.map((opt, i) => `${EMOJIS[i]} ${opt}`).join("\n\n");
    const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`📊 ${question}`).setDescription(description).setFooter({ text: `Poll by ${interaction.user.tag}` }).setTimestamp();
    const pollMsg = await channel.send({ embeds: [embed] });
    for (let i = 0; i < options.length; i++) await pollMsg.react(EMOJIS[i]).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Poll Created`).setDescription(`Poll posted in ${channel}.`)], ephemeral: true });
  },
};
