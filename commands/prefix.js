const fs = require("fs");
const path = require("path");
const { format, UNIRedux } = require("cassidy-styler");
module.exports = {
  name: "prefix",
  author: "Aljur Pogoy.",
  nonPrefix: true,
  description: "Shows the bot's current prefix with a Shadow Garden flair.",
  cooldown: 5,
  version: "4.0.0",
  async run({ api, event, prefix }) {
    const { threadID, messageID } = event;
    const mp4Path = path.join(__dirname, "cache", "tikmate-io_7291018407313493253 (online-video-cutter.com).mp4");
    try {
      if (!fs.existsSync(mp4Path)) {
        return api.sendMessage(
          format({
            title: "Prefix",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⚠️",
            content: "MP4 not found in cache! Mission compromised."
          }),
          threadID,
          messageID
        );
      }
      await api.sendMessage({
        body: format({
          title: "Prefix",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "🌐",
          content: `System Prefix: ${prefix}`
        }),
        attachment: fs.createReadStream(mp4Path)
      }, threadID, messageID);
    } catch (error) {
      console.error("Error sending prefix with MP4:", error);
      api.sendMessage(
        format({
          title: "Prefix",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "❌",
          content: "Failed to display the prefix. Mission failed."
        }),
        threadID,
        messageID
      );
    }
  },
};