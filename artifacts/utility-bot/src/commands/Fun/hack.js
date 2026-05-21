import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "#config/emoji";

const emails = [
  "epicgamer@pogmail.com",
  "jakob35@hotmail.com",
  "preston8@gmail.com",
  "annie.bogisich87@gmail.com",
  "kara30@gmail.com",
  "hazle.towne99@hotmail.com",
  "brennan48@yahoo.com",
  "dexter69@gmail.com",
  "sugon.deez@nuts.com",
  "nevergonnagive@you.up",
  "animegirls@weirdo.au",
  "orangutan@pog.com",
  "amogus@sus.red",
  "lookin.thick@pogmail.com",
  "gamer4life@hotmail.com",
  "noob_master69@gmail.com",
];

const passwords = [
  "password123",
  "iloveyou",
  "123456789",
  "qwerty123",
  "letmein",
  "monkey123",
  "dragon420",
  "master1234",
  "hunter2",
  "trustno1",
  "iamcool",
  "sunshine",
  "princess",
  "football",
  "welcome1",
  "abc123456",
];

const lastDms = [
  "hey babe, you up?",
  "can i borrow $20?",
  "dont tell anyone but...",
  "i still love my ex lol",
  "im so lonely tbh",
  "do you have any food?",
  "my mom says hi",
  "im pretending to work rn",
  "just failed my exam again",
  "send memes pls",
];

const ipAddresses = [
  "192.168.1.1",
  "10.0.0.1",
  "172.16.0.1",
  "69.420.69.420",
  "127.0.0.1",
  "255.255.255.0",
  "8.8.8.8",
  "1.1.1.1",
];

class HackCommand extends Command {
  constructor() {
    super({
      name: "hack",
      description: "Pretend to hack a user (just for fun!)",
      usage: "hack <@user>",
      aliases: ["wizz", "hax"],
      category: "Fun",
      examples: ["hack @user"],
      cooldown: 10,
      enabledSlash: true,
      slashData: {
        name: "hack",
        description: "Pretend to hack a user (just for fun!)",
        options: [{ name: "user", description: "Target user to hack", type: 6, required: true }],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const target = message.mentions.members.first() || 
                     (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

      if (!target) {
        return message.reply({
          content: `${emoji.get("cross")} Please mention a user to "hack"!\n**Usage:** \`${this.usage}\``,
        });
      }

      const randomEmail = emails[Math.floor(Math.random() * emails.length)];
      const randomPassword = passwords[Math.floor(Math.random() * passwords.length)];
      const randomDm = lastDms[Math.floor(Math.random() * lastDms.length)];
      const randomIp = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
      const randomAge = Math.floor(Math.random() * 50) + 13;

      const initialMsg = await message.reply({
        content: `${emoji.get("loading")} Hacking **${target.user.username}**...`,
      });

      const steps = [
        `${emoji.get("loading")} Finding Discord login...`,
        `${emoji.get("loading")} Bypassing 2FA...`,
        `${emoji.get("loading")} Injecting malware...`,
        `${emoji.get("loading")} Extracting data...`,
        `${emoji.get("loading")} Downloading DMs...`,
        `${emoji.get("check")} Hack complete!`,
      ];

      for (let i = 0; i < steps.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await initialMsg.edit({ content: steps[i] });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${emoji.get("check")} **Hack Complete!**`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      const hackInfo = 
        `**Target:** ${target.user.username}\n\n` +
        `**Stolen Data:**\n` +
        `├─ **Email:** ${randomEmail}\n` +
        `├─ **Password:** ${randomPassword}\n` +
        `├─ **IP Address:** ${randomIp}\n` +
        `├─ **Age:** ${randomAge} years old\n` +
        `└─ **Last DM:** "${randomDm}"`;

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(hackInfo)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            target.user.displayAvatarURL({ dynamic: true })
          )
        );

      container.addSectionComponents(section);

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `*This is just a joke command! No actual hacking occurred.*`
        )
      );

      await initialMsg.edit({
        content: null,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      client.logger?.error("HackCommand", `Error: ${error.message}`, error);
      await message.reply({
        content: `${emoji.get("cross")} An error occurred while "hacking".`,
      });
    }
  }

  async slashExecute({ client, interaction }) {
    const target = interaction.options.getMember("user");
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });
    await interaction.deferReply();
    const stages = [
      `🔓 Accessing **${target.user.username}**'s account...`,
      `🔑 Bypassing 2FA...`,
      `📡 Downloading IP address...`,
      `💾 Retrieving password database...`,
      `✅ **Hack complete!** ${target.user.username}'s data has been stolen! (not really 😄)`,
    ];
    let i = 0;
    await interaction.editReply({ content: stages[i] });
    const interval = setInterval(async () => {
      i++;
      if (i < stages.length) {
        await interaction.editReply({ content: stages[i] }).catch(() => {});
      } else {
        clearInterval(interval);
      }
    }, 1500);
  }
}

export default new HackCommand();
