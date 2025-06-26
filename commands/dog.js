const fs = require("fs");
const path = require("path");

module.exports = {
  name: "dog",
  author: "Aljur Pogoy",
  modefiedBy: "Raniel",
  description: "Sends a random dog video when triggered.",
  nonPrefix: true,

  async run({ api, event }) {
    const { threadID, messageID, body } = event;

    if (/^dog/i.test(body)) {
      const videoList = [
        "dog1.mp4",
        "dog2.mp4",
        "dog3.mp4",
        "dog4.mp4"
      ];

      const randomVideo = videoList[Math.floor(Math.random() * videoList.length)];
      const videoPath = path.join(__dirname, "cache", randomVideo);

      if (!fs.existsSync(videoPath)) {
        return api.sendMessage("❌ Video file not found!", threadID, messageID);
      }

      api.sendMessage(
        {
          attachment: fs.createReadStream(videoPath)
        },
        threadID,
        messageID
      );
    }
  }
};
