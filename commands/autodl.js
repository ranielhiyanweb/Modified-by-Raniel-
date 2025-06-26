const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
module.exports = {
  name: "autodl",
  nonPrefix: true,
  handleEvent: true,
  async handleEvent({ api, event }) {
    const { threadID, messageID, body } = event;
    const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com)\/[^\s]+)/i;
    const match = body ? body.match(urlRegex) : null;
    if (!match) return;
    try {
      const encodedUrl = encodeURIComponent(match[0]);
      const apiUrl = `https://haji-mix.up.railway.app/api/autodl?url=${encodedUrl}&stream=true&api_key=21b2b7f078ab98cb5af9a0bd4eaa24c4e1c3ec20b1c864006a6f03cf0eee6006`;
      const videoResponse = await axios({
        url: apiUrl,
        method: "GET",
        responseType: "stream",
      });
      const tempVideoPath = path.join(__dirname, "../temp/ba_video.mp4");
      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      let baMessage = `════『 AUTODL 』════\n\n`;
      baMessage += `✨ Here's your video! ✨\n\n`;
      const videoStream = fs.createReadStream(tempVideoPath);
      await api.sendMessage(
        {
          body: baMessage,
          attachment: videoStream,
        },
        threadID,
        messageID
      );
      fs.unlinkSync(tempVideoPath);
    } catch (error) {
      console.error("❌ Error in autodl event:", error.message);
      let errorMessage = `════『 AUTODL 』════\n\n`;
      errorMessage += `  ┏━━━━━━━┓\n`;
      errorMessage += `  ┃ 『 𝗜𝗡𝗙𝗢 』 An error occurred while fetching the video.\n`;
      errorMessage += `  ┃ ${error.message}\n`;
      errorMessage += `  ┗━━━━━━━┛\n\n`;
      errorMessage += `> Thank you for using Raniela's Bot`;
      api.sendMessage(errorMessage, threadID, messageID);
    }
  },
};
