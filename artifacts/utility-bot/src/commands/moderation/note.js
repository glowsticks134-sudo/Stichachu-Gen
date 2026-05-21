import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";

export default {
  name: "note",
  description: "Add, view, or delete moderator notes on a user",
  usage: "note <add <@user> <text> | view <@user> | delete <id> | clear <@user>>",
  aliases: ["notes", "usernote"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  enabledSlash: true,
  slashData: {
    name: "note",
    description: "Manage moderator notes on users",
    options: [
      { name: "add", description: "Add a note to a user", type: 1, options: [{ name: "user", description: "The user", type: 6, required: true }, { name: "text", description: "The note", type: 3, required: true }] },
      { name: "view", description: "View notes for a user", type: 1, options: [{ name: "user", description: "The user", type: 6, required: true }] },
      { name: "delete", description: "Delete a specific note by ID", type: 1, options: [{ name: "id", description: "Note ID", type: 4, required: true }] },
      { name: "clear", description: "Clear all notes for a user", type: 1, options: [{ name: "user", description: "The user", type: 6, required: true }] },
    ],
  },

  async execute({ client, message, args }) {
    const sub = args[0]?.toLowerCase();
    const guildId = message.guild.id;

    if (sub === "view") {
      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("User not found.")] });
      const notes = db.getNotes(guildId, target.id);
      if (!notes.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} Notes`).setDescription(`No notes for **${target.tag}**.`)] });
      const lines = notes.map(n => `**[#${n.id}]** <t:${Math.floor(new Date(n.created_at).getTime() / 1000)}:d> — ${n.note}`);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} Notes for ${target.tag}`).setDescription(lines.join("\n"))] });
    }

    if (sub === "add") {
      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("User not found.")] });
      const text = args.slice(2).join(" ");
      if (!text) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a note.")] });
      db.addNote(guildId, target.id, message.author.id, text);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Note Added`).setDescription(`Note added for **${target.tag}**.`)] });
    }

    if (sub === "delete") {
      const id = parseInt(args[1]);
      if (isNaN(id)) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("Please provide a valid note ID.")] });
      db.deleteNote(id, guildId);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Note Deleted`).setDescription(`Note #${id} deleted.`)] });
    }

    if (sub === "clear") {
      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Error`).setDescription("User not found.")] });
      db.clearNotes(guildId, target.id);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Notes Cleared`).setDescription(`All notes for **${target.tag}** deleted.`)] });
    }

    return message.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("cross")} Usage`).setDescription(`\`${this.usage}\``)] });
  },

  async slashExecute({ client, interaction }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "view") {
      const user = interaction.options.getUser("user");
      const notes = db.getNotes(guildId, user.id);
      if (!notes.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} Notes`).setDescription(`No notes for **${user.tag}**.`)], ephemeral: true });
      const lines = notes.map(n => `**[#${n.id}]** <t:${Math.floor(new Date(n.created_at).getTime() / 1000)}:d> — ${n.note}`);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("info")} Notes for ${user.tag}`).setDescription(lines.join("\n"))], ephemeral: true });
    }

    if (sub === "add") {
      const user = interaction.options.getUser("user");
      const text = interaction.options.getString("text");
      db.addNote(guildId, user.id, interaction.user.id, text);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Note Added`).setDescription(`Note added for **${user.tag}**.`)], ephemeral: true });
    }

    if (sub === "delete") {
      const id = interaction.options.getInteger("id");
      db.deleteNote(id, guildId);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Note Deleted`).setDescription(`Note #${id} deleted.`)], ephemeral: true });
    }

    if (sub === "clear") {
      const user = interaction.options.getUser("user");
      db.clearNotes(guildId, user.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`${emoji.get("check")} Notes Cleared`).setDescription(`All notes for **${user.tag}** cleared.`)], ephemeral: true });
    }
  },
};
