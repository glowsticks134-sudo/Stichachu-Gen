import { EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "tempchannel",
  description: "Create a temporary text channel that auto-deletes",
  usage: "tempchannel <name> <minutes>",
  aliases: ["temp", "tmpch", "createtemp"],
  category: "admin",
  cooldown: 15,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  permissions: [PermissionFlagsBits.ManageChannels],
  enabledSlash: true,
  slashData: {
    name: "tempchannel",
    description: "Create a temporary channel that auto-deletes",
    options: [
      { name: "name", description: "Channel name", type: 3, required: true },
      { name: "minutes", description: "Minutes until deletion (1-1440)", type: 4, required: true, min_value: 1, max_value: 1440 },
    ],
  },

  async execute({ client, message, args }) {
    const name = args[0];
    const mins = parseInt(args[1]);
    if (!name || isNaN(mins)) return message.reply({ content: `${emoji.get("cross")} Usage: \`${this.usage}\`` });
    return createTemp(message.guild, message.channel, name, Math.min(1440, Math.max(1, mins)), message);
  },

  async slashExecute({ client, interaction }) {
    const name = interaction.options.getString("name");
    const mins = interaction.options.getInteger("minutes");
    return createTemp(interaction.guild, interaction.channel, name, mins, interaction);
  },
};

async function createTemp(guild, context, name, mins, ctx) {
  const ch = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    topic: `Temporary channel — deletes in ${mins} minute(s)`,
  });

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("⏱️ Temporary Channel Created")
    .setDescription(`${ch} will be automatically deleted in **${mins} minute(s)**.`);

  await (ctx.reply ? ctx.reply({ embeds: [embed] }) : ctx.reply({ embeds: [embed] }));

  setTimeout(async () => {
    await ch.delete(`Temp channel expired after ${mins} minute(s)`).catch(() => {});
  }, mins * 60_000);
}
