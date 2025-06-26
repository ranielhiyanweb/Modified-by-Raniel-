 module.exports = {
  config: {
    name: "ping",
    nonPrefix: true,
    description: "Responds with Pong!",
    role: 3,
    cooldown: 5,
    aliases: ["p"],
  },
  async run({ api, event }) {
    const { threadID, messageID } = event;
    await api.sendMessage("Pong!", threadID);
  },
};
