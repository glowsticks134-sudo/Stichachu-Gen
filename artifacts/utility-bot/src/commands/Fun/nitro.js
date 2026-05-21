import { Command } from "#structures/classes/Command";

class NitroCommand extends Command {
  constructor() {
    super({
      name: "nitro",
      description: "Generate a fake nitro gift (just for fun!)",
      usage: "nitro",
      aliases: ["fakenitro", "nitrogift"],
      category: "Fun",
      examples: ["nitro"],
      cooldown: 10,
      enabledSlash: true,
      slashData: { name: "nitro", description: "Generate a fake nitro gift (just for fun!)" },
    });
  }

  async execute({ client, message, args }) {
    try {
      const fakeCode = this._generateFakeCode();
      await message.reply(`https://discord.gift/${fakeCode}`);
    } catch (error) {
      client.logger?.error("NitroCommand", `Error: ${error.message}`, error);
    }
  }

  async slashExecute({ client, interaction }) {
    const fakeCode = this._generateFakeCode();
    await interaction.reply(`https://discord.gift/${fakeCode}`);
  }

  _generateFakeCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export default new NitroCommand();
