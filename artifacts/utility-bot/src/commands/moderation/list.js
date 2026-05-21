import { Command } from "#classes/Command";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";

export default {
  name: "list",
  description: "List admins, bots, users in a role, or bans",
  usage: "list <admin|bot|inrole|ban> [role]",
  aliases: ["l"],
  category: "moderation",
  cooldown: 3,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  enabledSlash: true,
  slashData: {
    name: "list",
    description: "List admins, bots, users in a role, or bans",
    options: [
      {
        name: "type",
        description: "What to list",
        type: 3,
        required: true,
        choices: [
          { name: "Admins", value: "admin" },
          { name: "Bots", value: "bot" },
          { name: "Bans", value: "ban" },
        ],
      },
      { name: "role", description: "Role to list members of (for 'inrole' type)", type: 8, required: false },
    ],
  },

  async execute({ client, message, args }) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Invalid Usage`)
        .setDescription(
          `Please provide a list type.\n\n**Usage:** \`${this.usage}\`\n\n**Options:**\n` +
          `\`admin\` - List all administrators\n` +
          `\`bot\` - List all bots\n` +
          `\`inrole\` - List users in a specific role\n` +
          `\`ban\` - List all banned users`
        );

      return message.reply({ embeds: [embed] });
    }

    const type = args[0].toLowerCase();
    let listItems = [];
    let title = "";

    try {
      if (type === "admin" || type === "admins" || type === "administration") {
        const administrators = message.guild.members.cache.filter((member) =>
          member.permissions.has(PermissionFlagsBits.Administrator)
        );
        listItems = administrators.map(({ id, user }) => `${user.tag} | ${id}`);
        title = "Administrators";
      } else if (type === "bot" || type === "bots") {
        const bots = message.guild.members.cache.filter(
          (member) => member.user.bot
        );
        if (!bots.size) {
          const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`${emoji.get("info")} No Bots Found`)
            .setDescription("There are no bots in this server.");

          return message.reply({ embeds: [embed] });
        }
        listItems = bots.map(({ id, user }) => `${user.tag} | ${id}`);
        title = "Bots";
      } else if (type === "inrole" || type === "role") {
        const role =
          message.mentions.roles.first() ||
          message.guild.roles.cache.get(args[1]) ||
          message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(" ").toLowerCase());

        if (!role) {
          const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`${emoji.get("cross")} Role Not Found`)
            .setDescription("Please mention a role or provide its ID.\n\n**Usage:** `list inrole <role>`");

          return message.reply({ embeds: [embed] });
        }

        if (!role.members.size) {
          const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`${emoji.get("info")} No Members`)
            .setDescription(`No members have the ${role} role.`);

          return message.reply({ embeds: [embed] });
        }

        listItems = role.members.map(({ id, user }) => `${user.tag} | ${id}`);
        title = `Members with ${role.name}`;
      } else if (type === "ban" || type === "bans") {
        const bans = await message.guild.bans.fetch();
        
        if (!bans.size) {
          const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`${emoji.get("info")} No Bans`)
            .setDescription("There are no banned users in this server.");

          return message.reply({ embeds: [embed] });
        }

        listItems = bans.map(({ user }) => `${user.tag} | ${user.id}`);
        title = "Banned Users";
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("cross")} Invalid Type`)
          .setDescription(
            `Invalid list type provided.\n\n**Options:**\n` +
            `\`admin\` - List all administrators\n` +
            `\`bot\` - List all bots\n` +
            `\`inrole\` - List users in a specific role\n` +
            `\`ban\` - List all banned users`
          );

        return message.reply({ embeds: [embed] });
      }

      const pageSize = 10;
      let currentPage = 0;
      const totalPages = Math.ceil(listItems.length / pageSize);

      const generateEmbed = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        const pageItems = listItems.slice(start, end);

        let description = pageItems.map((item, i) => `${start + i + 1}. ${item}`).join("\n");

        return new EmbedBuilder()
          .setTitle(`${title} (${listItems.length} total)`)
          .setDescription(description || "No items to display.")
          .setColor(0x000000)
          .setFooter({
            text: `Page ${page + 1} of ${totalPages}`,
          });
      };

      const generateButtons = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("list_prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("list_next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1),
          new ButtonBuilder()
            .setLabel("Support")
            .setURL(config.links.supportServer)
            .setStyle(ButtonStyle.Link)
        );
      };

      const reply = await message.reply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [generateButtons(currentPage)] : [],
      });

      if (totalPages > 1) {
        const collector = reply.createMessageComponentCollector({
          time: 300000,
        });

        collector.on("collect", async (interaction) => {
          if (interaction.user.id !== message.author.id) {
            return interaction.reply({
              content: "This pagination is not for you!",
              ephemeral: true,
            });
          }

          if (interaction.customId === "list_next") {
            currentPage++;
          } else if (interaction.customId === "list_prev") {
            currentPage--;
          }

          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)],
          });
        });

        collector.on("end", () => {
          reply.edit({ components: [] }).catch(() => {});
        });
      }
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} Error`)
        .setDescription(`Failed to fetch list: ${error.message}`);

      return message.reply({ embeds: [embed] });
    }
  },

  async slashExecute({ client, interaction }) {
    const type = interaction.options.getString("type");
    let listItems = [], title = "";
    try {
      if (type === "admin") {
        const admins = interaction.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator));
        listItems = admins.map(m => `${m.user.tag}`);
        title = "Administrators";
      } else if (type === "bot") {
        const bots = interaction.guild.members.cache.filter(m => m.user.bot);
        listItems = bots.map(m => `${m.user.tag}`);
        title = "Bots";
      } else if (type === "ban") {
        const bans = await interaction.guild.bans.fetch();
        listItems = bans.map(b => `${b.user.tag}`);
        title = "Banned Users";
      }
      const desc = listItems.slice(0, 30).join("\n") || "None found.";
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x000000).setTitle(`📋 ${title} (${listItems.length})`).setDescription(desc + (listItems.length > 30 ? `\n*...and ${listItems.length - 30} more*` : ""))], ephemeral: true });
    } catch (e) {
      return interaction.reply({ content: `Error: ${e.message}`, ephemeral: true });
    }
  },
};
