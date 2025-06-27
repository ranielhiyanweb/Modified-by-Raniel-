module.exports = {
  config: {
    name: "reload",
    description: "Reload all commands without restarting the bot",
    role: 2,
    cooldown: 5,
    aliases: ["refresh", "cmdreload"],
    version: "4.0.0"
  },
  async run({ api, event }) {
    const { threadID, messageID } = event;
    try {
      global.reloadCommands();
      await api.sendMessage("✅ Commands reloaded successfully!", threadID, messageID);
    } catch (error) {
      await api.sendMessage(`❌ Error reloading commands: ${error.message}`, threadID, messageID);
      await api.setMessageReaction("❌", messageID, () => {});
    }
  },
};