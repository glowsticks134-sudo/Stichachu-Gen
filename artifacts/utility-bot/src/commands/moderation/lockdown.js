import { EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import emoji from "#config/emoji";

export default {
  name: "lockdown",
  description: "Lock down the entire server (all text channels) in an emergency",
  usage: "lockdown <on|off> [reason]",
  aliases: ["lockall", "serverlockdown"],
  category: "moderation",
  cooldown: 30,
  userPermissions: [PermissionFlagsBits.Administrator],
  permissions: [PermissionFlagsBits.ManageChannels],
  enabledSlash: true,
  slashData: {
    name: "lockdown",
    description: "Lock or unlock all text channels in the server",
    options: [
      {
        name: "action",
        description: "on = lock all channels, off = unlock all channels",
        type: 3,
        required: true,
        choices: [
          { name: "on", value: "on" },
          { name: "off", value: "off" },
        ],
      },
      { name: "reason", description: "Reason for lockdown", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const action = args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
    const reason = args.slice(1).join(" ") || (action === "on" ? "Server lockdown" : "Lockdown lifted");
    const locking = action === "on";

    const status = await message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} ${locking ? "Locking" : "Unlocking"} Server...`).setDescription("Processing all channels...")] });

    const everyoneRole = message.guild.roles.everyone;
    const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    let success = 0;
    for (const [, ch] of channels) {
      try {
        await ch.permissionOverwrites.edit(everyoneRole, { SendMessages: locking ? false : null });
        success++;
      } catch {}
    }

    return status.edit({ embeds: [new EmbedBuilder().setColor(locking ? 0xff0000 : 0x00ff00).setTitle(`${locking ? emoji.get("lock") : emoji.get("unlock")} Server ${locking ? "Locked Down" : "Unlocked"}`).setDescription(`**Channels affected:** ${success}\n**Reason:** ${reason}`)] });
  },

  async slashExecute({ client, interaction }) {
    const action = interaction.options.getString("action");
    const reason = interaction.options.getString("reason") || (action === "on" ? "Server lockdown" : "Lockdown lifted");
    const locking = action === "on";

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("loading")} ${locking ? "Locking" : "Unlocking"} Server...`).setDescription("Processing...")] });

    const everyoneRole = interaction.guild.roles.everyone;
    const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    let success = 0;
    for (const [, ch] of channels) {
      try {
        await ch.permissionOverwrites.edit(everyoneRole, { SendMessages: locking ? false : null });
        success++;
      } catch {}
    }

    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(locking ? 0xff0000 : 0x00ff00).setTitle(`${locking ? emoji.get("lock") : emoji.get("unlock")} Server ${locking ? "Locked Down" : "Unlocked"}`).setDescription(`**Channels affected:** ${success}\n**Reason:** ${reason}`)] });
  },
};
