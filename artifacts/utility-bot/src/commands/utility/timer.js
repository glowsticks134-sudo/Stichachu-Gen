import { Command } from "#structures/classes/Command";
import {
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
        ContainerBuilder,
        MessageFlags,
        SectionBuilder,
        SeparatorBuilder,
        SeparatorSpacingSize,
        TextDisplayBuilder,
        ThumbnailBuilder,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";

class TimerCommand extends Command {
        constructor() {
                super({
                        name: "timer",
                        description: "Set a timer for a specified number of days",
                        usage: "timer <number of days>",
                        aliases: ["remind", "reminder", "settimer"],
                        category: "utility",
                        examples: ["timer 1", "timer 7", "timer 30"],
                        cooldown: 5,
                        enabledSlash: true,
                        slashData: {
                                name: "timer",
                                description: "Set a timer for a specified number of days",
                                options: [
                                        {
                                                name: "days",
                                                description: "Number of days for the timer",
                                                type: 4,
                                                required: true,
                                                min_value: 1,
                                                max_value: 365,
                                        },
                                ],
                        },
                });
                
                this.activeTimers = new Map();
        }

        async execute({ client, message, args }) {
                try {
                        if (!args[0]) {
                                return await message.reply({
                                        components: [this._createErrorContainer("Please provide the number of days for the timer.\n\n**Usage:** `timer <number of days>`\n**Example:** `timer 7`")],
                                        flags: MessageFlags.IsComponentsV2,
                                });
                        }

                        const days = parseInt(args[0]);

                        if (isNaN(days) || days < 1) {
                                return await message.reply({
                                        components: [this._createErrorContainer("Please provide a valid number of days (minimum 1 day).")],
                                        flags: MessageFlags.IsComponentsV2,
                                });
                        }

                        if (days > 365) {
                                return await message.reply({
                                        components: [this._createErrorContainer("Timer cannot exceed 365 days.")],
                                        flags: MessageFlags.IsComponentsV2,
                                });
                        }

                        const endTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                        const timerId = `${message.author.id}-${Date.now()}`;

                        this._storeTimer(timerId, {
                                userId: message.author.id,
                                channelId: message.channel.id,
                                guildId: message.guild?.id,
                                days: days,
                                endTime: endTime.getTime(),
                                startTime: Date.now(),
                        });

                        const timerMessage = await message.reply({
                                components: [this._createTimerContainer(days, endTime, message.author)],
                                flags: MessageFlags.IsComponentsV2,
                        });

                        this._setupTimerReminder(client, timerId, timerMessage, message.author, days, endTime);
                        this._setupCollector(timerMessage, message.author.id, timerId);

                } catch (error) {
                        client.logger?.error(
                                "TimerCommand",
                                `Error in prefix command: ${error.message}`,
                                error,
                        );
                        await message
                                .reply({
                                        components: [this._createErrorContainer("An error occurred while setting the timer.")],
                                        flags: MessageFlags.IsComponentsV2,
                                })
                                .catch(() => {});
                }
        }

        async slashExecute({ client, interaction }) {
                try {
                        const days = interaction.options.getInteger("days");

                        const endTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                        const timerId = `${interaction.user.id}-${Date.now()}`;

                        this._storeTimer(timerId, {
                                userId: interaction.user.id,
                                channelId: interaction.channel.id,
                                guildId: interaction.guild?.id,
                                days: days,
                                endTime: endTime.getTime(),
                                startTime: Date.now(),
                        });

                        const timerMessage = await interaction.reply({
                                components: [this._createTimerContainer(days, endTime, interaction.user)],
                                flags: MessageFlags.IsComponentsV2,
                                fetchReply: true,
                        });

                        this._setupTimerReminder(client, timerId, timerMessage, interaction.user, days, endTime);
                        this._setupCollector(timerMessage, interaction.user.id, timerId);

                } catch (error) {
                        client.logger?.error(
                                "TimerCommand",
                                `Error in slash command: ${error.message}`,
                                error,
                        );
                        try {
                                if (interaction.replied || interaction.deferred) {
                                        await interaction.editReply({
                                                components: [this._createErrorContainer("An error occurred while setting the timer.")],
                                        });
                                } else {
                                        await interaction.reply({
                                                components: [this._createErrorContainer("An error occurred while setting the timer.")],
                                                ephemeral: true,
                                        });
                                }
                        } catch (e) {}
                }
        }

        _storeTimer(timerId, timerData) {
                this.activeTimers.set(timerId, timerData);
        }

        _removeTimer(timerId) {
                this.activeTimers.delete(timerId);
        }

        _createTimerContainer(days, endTime, user) {
                const container = new ContainerBuilder();

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emoji.get("timer")} **Timer Set!**`),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                const formattedEndTime = this._formatDate(endTime);
                const discordTimestamp = Math.floor(endTime.getTime() / 1000);

                const content =
                        `**Timer Details:**\n` +
                        `├─ **Duration:** ${days} day${days > 1 ? 's' : ''}\n` +
                        `├─ **Set by:** ${user.tag}\n` +
                        `├─ **Ends at:** ${formattedEndTime}\n` +
                        `└─ **Countdown:** <t:${discordTimestamp}:R>\n\n` +
                        `You will be notified when the timer ends!`;

                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                const buttonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                                .setCustomId("timer_cancel")
                                .setLabel("Cancel Timer")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji(emoji.get("cross")),
                        new ButtonBuilder()
                                .setCustomId("timer_info")
                                .setLabel("Timer Info")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji(emoji.get("info")),
                );

                container.addActionRowComponents(buttonRow);

                return container;
        }

        _createCancelledContainer() {
                const container = new ContainerBuilder();

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emoji.get("cross")} **Timer Cancelled**`),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("The timer has been cancelled successfully."),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                return container;
        }

        _createCompletedContainer(days, user) {
                const container = new ContainerBuilder();

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emoji.get("check")} **Timer Complete!**`),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                const content =
                        `**${user}, your timer has ended!**\n\n` +
                        `├─ **Duration:** ${days} day${days > 1 ? 's' : ''}\n` +
                        `└─ **Completed:** ${this._formatDate(new Date())}`;

                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                return container;
        }

        _createErrorContainer(message) {
                const container = new ContainerBuilder();

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emoji.get("cross")} **Error**`),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(message));

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                return container;
        }

        _formatDate(date) {
                return date.toLocaleString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                });
        }

        _setupTimerReminder(client, timerId, message, user, days, endTime) {
                const timeUntilEnd = endTime.getTime() - Date.now();

                const timeout = setTimeout(async () => {
                        try {
                                const timerData = this.activeTimers.get(timerId);
                                if (!timerData) return;

                                const channel = await client.channels.fetch(timerData.channelId).catch(() => null);
                                if (channel) {
                                        await channel.send({
                                                content: `<@${user.id}>`,
                                                components: [this._createCompletedContainer(days, user)],
                                                flags: MessageFlags.IsComponentsV2,
                                        });
                                }

                                this._removeTimer(timerId);

                                try {
                                        const fetchedMessage = await message.fetch().catch(() => null);
                                        if (fetchedMessage) {
                                                await fetchedMessage.edit({
                                                        components: [this._createExpiredContainer(days)],
                                                });
                                        }
                                } catch (e) {}
                        } catch (error) {
                                client.logger?.error(
                                        "TimerCommand",
                                        `Error in timer reminder: ${error.message}`,
                                        error,
                                );
                        }
                }, Math.min(timeUntilEnd, 2147483647));

                const timerData = this.activeTimers.get(timerId);
                if (timerData) {
                        timerData.timeout = timeout;
                        this.activeTimers.set(timerId, timerData);
                }
        }

        _createExpiredContainer(days) {
                const container = new ContainerBuilder();

                container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emoji.get("check")} **Timer Completed**`),
                );

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                const content =
                        `**Timer has ended!**\n\n` +
                        `├─ **Duration:** ${days} day${days > 1 ? 's' : ''}\n` +
                        `└─ **Status:** Completed`;

                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

                container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
                );

                return container;
        }

        _setupCollector(message, userId, timerId) {
                const collector = message.createMessageComponentCollector({
                        filter: (i) => i.user.id === userId,
                        time: 300_000,
                });

                collector.on("collect", async (interaction) => {
                        try {
                                if (interaction.customId === "timer_cancel") {
                                        const timerData = this.activeTimers.get(timerId);
                                        if (timerData?.timeout) {
                                                clearTimeout(timerData.timeout);
                                        }
                                        this._removeTimer(timerId);

                                        await interaction.update({
                                                components: [this._createCancelledContainer()],
                                                flags: MessageFlags.IsComponentsV2,
                                        });
                                        collector.stop();
                                } else if (interaction.customId === "timer_info") {
                                        const timerData = this.activeTimers.get(timerId);
                                        if (timerData) {
                                                const remaining = timerData.endTime - Date.now();
                                                const info = this._formatTimeRemaining(remaining);
                                                await interaction.reply({
                                                        content: `**Time Remaining:** ${info}`,
                                                        ephemeral: true,
                                                });
                                        } else {
                                                await interaction.reply({
                                                        content: "This timer is no longer active.",
                                                        ephemeral: true,
                                                });
                                        }
                                }
                        } catch (error) {}
                });
        }

        _formatTimeRemaining(ms) {
                if (ms <= 0) return "Timer has ended!";

                const seconds = Math.floor((ms / 1000) % 60);
                const minutes = Math.floor((ms / (1000 * 60)) % 60);
                const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
                const days = Math.floor(ms / (1000 * 60 * 60 * 24));

                const parts = [];
                if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
                if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
                if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
                if (seconds > 0 && days === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

                return parts.join(', ') || 'Less than a second';
        }
}

export default new TimerCommand();
