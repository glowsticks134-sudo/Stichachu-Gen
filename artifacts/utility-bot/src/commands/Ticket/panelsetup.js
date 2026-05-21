import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { db } from "#database/DatabaseManager";
import emoji from "#config/emoji";
import { config } from "#config/config";

export default {
  name: "panelsetup",
  description: "Create a new ticket panel with step-by-step setup",
  usage: "panelsetup",
  aliases: ["ticketpanel", "createpanel"],
  category: "Ticket",
  cooldown: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],

  async execute({ client, message, args, prefix }) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("cross")} No Permission`)
        .setDescription("You need the **Manage Server** permission to use this command.");

      return message.reply({ embeds: [embed] });
    }

    const panelId = db.incrementPanelCounter(message.guild.id);

    const setupData = {
      guildId: message.guild.id,
      panelId: panelId,
      categories: [],
      supportRoles: [],
    };

    const filter = (m) => m.author.id === message.author.id;
    const timeout = 300000;

    const createStepEmbed = (step, total, title, description) => {
      return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("ticketPanel")} Ticket Panel Setup #${panelId}`)
        .setDescription(
          `**Step ${step} of ${total}**\n\n` +
          `${title}\n\n` +
          `${description}\n\n` +
          `Reply within 5 minutes or setup will be cancelled.`
        );
    };

    try {
      await message.reply({
        embeds: [
          createStepEmbed(
            1,
            10,
            `${emoji.get("ticketCategory")} **Open Category ID**`,
            "This is the category where new tickets will be created.\n\nReply with the **category ID**."
          ),
        ],
      });

      const q1 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const openCategoryId = q1.first().content.trim();
      const openCategory = message.guild.channels.cache.get(openCategoryId);

      if (!openCategory || openCategory.type !== ChannelType.GuildCategory) {
        return sendError(message, "Invalid category ID. Setup cancelled.");
      }
      setupData.categoryOpen = openCategoryId;

      await message.channel.send({
        embeds: [
          createStepEmbed(
            2,
            10,
            `${emoji.get("ticketClose")} **Closed Category ID**`,
            "This is the category where closed tickets will be moved.\n\nReply with the **category ID**."
          ),
        ],
      });

      const q2 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const closedCategoryId = q2.first().content.trim();
      const closedCategory = message.guild.channels.cache.get(closedCategoryId);

      if (
        !closedCategory ||
        closedCategory.type !== ChannelType.GuildCategory
      ) {
        return sendError(message, "Invalid category ID. Setup cancelled.");
      }
      setupData.categoryClosed = closedCategoryId;

      await message.channel.send({
        embeds: [
          createStepEmbed(
            3,
            10,
            `${emoji.get("ticketTranscript")} **Transcript Channel ID**`,
            "This is the channel where transcripts will be sent.\n\nReply with the **channel ID** or `skip` to skip."
          ),
        ],
      });

      const q3 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const transcriptInput = q3.first().content.trim();
      if (transcriptInput.toLowerCase() !== "skip") {
        const transcriptChannel =
          message.guild.channels.cache.get(transcriptInput);
        if (transcriptChannel && transcriptChannel.isTextBased()) {
          setupData.transcriptChannel = transcriptInput;
        }
      }

      await message.channel.send({
        embeds: [
          createStepEmbed(
            4,
            10,
            `${emoji.get("ticketStar")} **Review Channel ID**`,
            "This is the channel where user reviews/ratings will be sent.\n\nReply with the **channel ID** or `skip` to skip."
          ),
        ],
      });

      const q3b = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const reviewInput = q3b.first().content.trim();
      if (reviewInput.toLowerCase() !== "skip") {
        const reviewChannel =
          message.guild.channels.cache.get(reviewInput);
        if (reviewChannel && reviewChannel.isTextBased()) {
          setupData.reviewChannel = reviewInput;
        }
      }

      await message.channel.send({
        embeds: [
          createStepEmbed(
            5,
            10,
            `${emoji.get("ticketSupport")} **Support Roles**`,
            "These roles can manage tickets.\n\nReply with **role IDs separated by commas** or `skip` to skip.\nExample: `1234567890, 0987654321`"
          ),
        ],
      });

      const q4 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const rolesInput = q4.first().content.trim();
      if (rolesInput.toLowerCase() !== "skip") {
        const roleIds = rolesInput.split(",").map((id) => id.trim());
        const validRoles = roleIds.filter((id) =>
          message.guild.roles.cache.has(id)
        );
        setupData.supportRoles = validRoles;
      }

      await message.channel.send({
        embeds: [
          createStepEmbed(
            6,
            10,
            `${emoji.get("ticketPanel")} **Panel Title**`,
            "This is the title of your ticket panel.\n\nReply with the **title** or `skip` for default."
          ),
        ],
      });

      const q5 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const titleInput = q5.first().content.trim();
      setupData.panelTitle =
        titleInput.toLowerCase() === "skip"
          ? "Support Tickets"
          : titleInput.substring(0, 100);

      await message.channel.send({
        embeds: [
          createStepEmbed(
            7,
            10,
            `${emoji.get("info")} **Panel Description**`,
            "This is the description shown on your ticket panel.\n\nReply with the **description** or `skip` for default."
          ),
        ],
      });

      const q6 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const descInput = q6.first().content.trim();
      setupData.panelDescription =
        descInput.toLowerCase() === "skip"
          ? "Click below to create a support ticket. Our team will assist you as soon as possible."
          : descInput.substring(0, 1000);

      await message.channel.send({
        embeds: [
          createStepEmbed(
            8,
            10,
            `${emoji.get("ticketCategory")} **Use Dropdown Menu?**`,
            "Do you want to use a dropdown menu for categories?\n\nReply with `yes` for dropdown or `no` for buttons."
          ),
        ],
      });

      const q7 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      setupData.useDropdown =
        q7.first().content.trim().toLowerCase() === "yes";

      await message.channel.send({
        embeds: [
          createStepEmbed(
            9,
            10,
            `${emoji.get("ticket")} **How Many Categories?**`,
            "How many ticket categories do you want to create?\n\nReply with a **number** between 1 and 10.\nExample: `3`"
          ),
        ],
      });

      const q8 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      
      let categoryCount = parseInt(q8.first().content.trim());
      if (isNaN(categoryCount) || categoryCount < 1) categoryCount = 1;
      if (categoryCount > 10) categoryCount = 10;

      const dynamicCreateStepEmbed = (step, total, title, description) => {
        return new EmbedBuilder()
          .setColor(0x000000)
          .setTitle(`${emoji.get("ticketPanel")} Ticket Panel Setup #${panelId}`)
          .setDescription(
            `**Step ${step} of ${total}**\n\n` +
            `${title}\n\n` +
            `${description}\n\n` +
            `Reply within 5 minutes or setup will be cancelled.`
          );
      };

      const totalSteps = 10 + (categoryCount * 3);
      let currentStep = 10;

      for (let i = 0; i < categoryCount; i++) {
        await message.channel.send({
          embeds: [
            dynamicCreateStepEmbed(
              currentStep,
              totalSteps,
              `${emoji.get("ticket")} **Category ${i + 1} - Name**`,
              `What should category **#${i + 1}** be called?\n\nReply with the **category name**.\nExample: \`General Support\` or \`Bug Report\``
            ),
          ],
        });
        currentStep++;

        const catNameResponse = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: timeout,
          errors: ["time"],
        });
        const catName = catNameResponse.first().content.trim().substring(0, 50);

        await message.channel.send({
          embeds: [
            dynamicCreateStepEmbed(
              currentStep,
              totalSteps,
              `${emoji.get("info")} **Category ${i + 1} - Description**`,
              `What description should **${catName}** have?\n\nReply with the **description** or \`skip\` for default.\nExample: \`Get help with general questions\``
            ),
          ],
        });
        currentStep++;

        const catDescResponse = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: timeout,
          errors: ["time"],
        });
        const catDescInput = catDescResponse.first().content.trim();
        const catDescription = catDescInput.toLowerCase() === "skip" 
          ? `Create a ${catName} ticket` 
          : catDescInput.substring(0, 100);

        await message.channel.send({
          embeds: [
            dynamicCreateStepEmbed(
              currentStep,
              totalSteps,
              `${emoji.get("ticketCategory")} **Category ${i + 1} - Emoji**`,
              `What emoji should **${catName}** use?\n\nReply with an **emoji** or \`skip\` for none.\nExample: \`:ticket:\` or a Unicode emoji`
            ),
          ],
        });
        currentStep++;

        const catEmojiResponse = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: timeout,
          errors: ["time"],
        });
        const catEmojiInput = catEmojiResponse.first().content.trim();
        const catEmoji = catEmojiInput.toLowerCase() === "skip" ? null : catEmojiInput;

        setupData.categories.push({
          name: catName,
          description: catDescription,
          emoji: catEmoji,
        });
      }

      if (setupData.categories.length === 0) {
        setupData.categories.push({
          name: "General Support",
          description: "Create a general support ticket",
          emoji: null,
        });
      }

      await message.channel.send({
        embeds: [
          dynamicCreateStepEmbed(
            currentStep,
            totalSteps,
            `${emoji.get("channel")} **Panel Channel**`,
            "Where should the ticket panel be sent?\n\nReply with the **channel ID** or mention (e.g., #tickets)."
          ),
        ],
      });

      const q9 = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });
      const channelInput = q9.first().content.trim();
      const panelChannel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(channelInput);

      if (!panelChannel || !panelChannel.isTextBased()) {
        return sendError(message, "Invalid channel. Setup cancelled.");
      }

      db.createTicketPanel(setupData);

      const panelEmbed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("ticketPanel")} ${setupData.panelTitle}`)
        .setDescription(setupData.panelDescription);

      let components = [];

      if (setupData.useDropdown) {
        const { StringSelectMenuBuilder } = await import("discord.js");
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`ticket_create_${panelId}`)
          .setPlaceholder("Select a ticket category")
          .addOptions(
            setupData.categories.map((cat, index) => ({
              label: cat.name,
              description: cat.description,
              value: `${panelId}_${index}`,
              emoji: cat.emoji || undefined,
            }))
          );

        components.push(new ActionRowBuilder().addComponents(selectMenu));
      } else {
        const buttons = setupData.categories.map((cat, index) => {
          const btn = new ButtonBuilder()
            .setCustomId(`ticket_create_${panelId}_${index}`)
            .setLabel(cat.name)
            .setStyle(ButtonStyle.Primary);
          if (cat.emoji) btn.setEmoji(cat.emoji);
          return btn;
        });

        for (let i = 0; i < buttons.length; i += 5) {
          components.push(
            new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
          );
        }
      }

      const panelMessage = await panelChannel.send({
        embeds: [panelEmbed],
        components: components,
      });

      db.updateTicketPanel(message.guild.id, panelId, {
        panel_channel_id: panelChannel.id,
        panel_message_id: panelMessage.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${emoji.get("check")} Ticket Panel Created Successfully!`)
        .setDescription(
          `**Panel ID:** ${panelId}\n` +
          `**Channel:** ${panelChannel}\n` +
          `**Categories:** ${setupData.categories.length}\n` +
          `**Type:** ${setupData.useDropdown ? "Dropdown Menu" : "Buttons"}\n` +
          `**Support Roles:** ${setupData.supportRoles.length > 0 ? setupData.supportRoles.map((r) => `<@&${r}>`).join(", ") : "None"}\n\n` +
          `Your professional ticket panel is now active!`
        );

      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      if (error.message === "time" || error.size === 0) {
        db.decrementPanelCounter(message.guild.id);
        return sendError(
          message,
          "Setup cancelled due to timeout (5 minutes)."
        );
      }

      console.error("Panel setup error:", error);
      db.decrementPanelCounter(message.guild.id);
      return sendError(
        message,
        `An error occurred during setup: ${error.message}`
      );
    }
  },
};

function sendError(message, errorMessage) {
  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle(`${emoji.get("cross")} Setup Failed`)
    .setDescription(errorMessage);

  return message.channel.send({ embeds: [embed] });
}
