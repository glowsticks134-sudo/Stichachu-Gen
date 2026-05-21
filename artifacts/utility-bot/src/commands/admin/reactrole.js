import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "reactrole",
  description: "Send a button-based role assignment message",
  usage: "reactrole <#channel> <@role> [button label]",
  aliases: ["buttonrole", "rolepicker", "rolebutton"],
  category: "admin",
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.ManageRoles],
  permissions: [PermissionFlagsBits.ManageRoles],
  enabledSlash: true,
  slashData: {
    name: "reactrole",
    description: "Send a button-based self-role panel",
    options: [
      { name: "channel", description: "Where to send the panel", type: 7, required: true },
      { name: "role", description: "Role to assign", type: 8, required: true },
      { name: "label", description: "Button label", type: 3, required: false },
    ],
  },

  async execute({ client, message, args }) {
    const channel = message.mentions.channels.first();
    const role = message.mentions.roles.first();
    if (!channel || !role) return message.reply({ content: `${emoji.get("cross")} Usage: \`${this.usage}\`` });
    const label = args.slice(2).join(" ") || `Get ${role.name}`;
    await sendPanel(channel, role, label, message.guild);
    return message.reply({ content: `${emoji.get("check")} Role panel sent to ${channel}!` });
  },

  async slashExecute({ client, interaction }) {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");
    const label = interaction.options.getString("label") || `Get ${role.name}`;
    await sendPanel(channel, role, label, interaction.guild);
    return interaction.reply({ content: `${emoji.get("check")} Role panel sent to ${channel}!`, ephemeral: true });
  },
};

async function sendPanel(channel, role, label, guild) {
  const button = new ButtonBuilder()
    .setCustomId(`reactrole_${role.id}`)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  const embed = new EmbedBuilder()
    .setColor(role.color || 0x5865f2)
    .setTitle("🎭 Self-Role")
    .setDescription(`Click the button below to toggle the **${role.name}** role!`);

  await channel.send({ embeds: [embed], components: [row] });
}
