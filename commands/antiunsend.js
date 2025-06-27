const cache = new Map();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "antiunsend",
  description: "Automatically detects and resends deleted messages.",
  author: "Aljur Pogoy",
  nonPrefix: true,
  handleEvent: true,

  async handleEvent({ api, event }) {
    const { messageID, senderID, threadID, type, body, attachments } = event;

    // 1. Store messages into cache
    if (type === "message" && (body || attachments.length > 0)) {
      cache.set(messageID, {
        senderID,
        threadID,
        body,
        attachments,
        timestamp: Date.now()
      });

      // Optional: auto-clean cache (older than 1 hour)
      for (const [id, data] of cache.entries()) {
        if (Date.now() - data.timestamp > 3600000) {
          cache.delete(id);
        }
      }
    }

    // 2. Detect if a message is unsent
    if (type === "message_unsend") {
      const cachedMsg = cache.get(messageID);
      if (!cachedMsg) return;

      try {
        const userInfo = await api.getUserInfo(cachedMsg.senderID);
        const senderName = userInfo[cachedMsg.senderID]?.name || "Unknown User";

        let messageBody = `🚫 Bawal mag-unsend!\n👤 Sender: ${senderName}\n🗨️ Content: `;

        if (cachedMsg.body) {
          messageBody += `"${cachedMsg.body}"`;
        } else if (cachedMsg.attachments.length > 0) {
          const type = cachedMsg.attachments[0].type;
          messageBody += `[Attachment: ${type}]`;
        } else {
          messageBody += "No content found.";
        }

        const sendOptions = { body: messageBody };

        // Handle attachment (image, etc.)
        if (cachedMsg.attachments.length > 0) {
          const attachmentUrl = cachedMsg.attachments[0].url;
          const fileName = `unsend_${Date.now()}`;
          const ext = cachedMsg.attachments[0].type === "photo" ? ".jpg" : ".bin";
          const filePath = path.join(__dirname, "..", "cache", fileName + ext);

          const res = await axios.get(attachmentUrl, { responseType: "stream" });
          const writer = fs.createWriteStream(filePath);
          res.data.pipe(writer);

          await new Promise(resolve => writer.on("finish", resolve));
          sendOptions.attachment = fs.createReadStream(filePath);

          api.sendMessage(sendOptions, threadID, () => fs.unlinkSync(filePath));
        } else {
          api.sendMessage(sendOptions, threadID);
        }
      } catch (err) {
        console.error("❌ Error handling unsent message:", err.message);
      }

      cache.delete(messageID);
    }
  }
};
