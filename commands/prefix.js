const fs = require("fs");
const path = require("path");
const { format, UNIRedux } = require("cassidy-styler");

module.exports = {
  name: "prefix",
  author: "Aljur Pogoy",
  modefier: "Raniel",
  nonPrefix: true,
  description: "Shows the bot's current prefix with a Shadow Garden flair.",
  cooldown: 5,
  version: "4.0.0",

  async run({ api, event, prefix }) {
    const { threadID, messageID } = event;
    const cache2Dir = path.join(__dirname, "cache2");

    try {
      // Get all mp4 files in cache2
      const videoFiles = fs.readdirSync(cache2Dir).filter(file => file.endsWith(".mp4"));

      if (videoFiles.length === 0) {
        return api.sendMessage(
          format({
            title: "Prefix",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⚠️",
            content: "No videos found in cache2 folder!"
          }),
          threadID,
          messageID
        );
      }

      // Select a random video
      const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
      const videoPath = path.join(cache2Dir, randomVideo);

      // Send response
      await api.sendMessage({
        body: format({
          title: "Prefix",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "🌐",
          content: `𝖲𝗒𝗌𝗍𝖾𝗆 𝖯𝗋𝖾𝖿𝗂𝗑: ${prefix}\n`
        }),
        attachment: fs.createReadStream(videoPath)
      }, threadID, messageID);

    } catch (error) {
      console.error("Error sending prefix with random video:", error);
      api.sendMessage(
        format({
          title: "Prefix",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "❌",
          content: "❌ Failed to load random video with prefix."
        }),
        threadID,
        messageID
      );
    }
  },
};
