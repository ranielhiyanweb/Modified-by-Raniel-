const axios = require("axios");

module.exports = {
  config: {
    name: "rbg",
    nonPrefix: true,
    description: "Remove image background using Kaiz API.",
    author: "ranjel",
    usage: "rbg (reply to a photo)",
    nonPrefix: true,
    version: "4.0.0"
  },

  run: async ({ api, event, args }) => {
    const { threadID, messageID, senderID, messageReply } = event;

    if (
      !messageReply ||
      !messageReply.attachments ||
      messageReply.attachments.length === 0 ||
      messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "❌ Please reply to a message containing a photo to remove its background.\nUsage: Reply to a photo with #rbg",
        threadID,
        messageID
      );
    }

    const photoUrl = messageReply.attachments[0].url;

    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/removebgv3`;
      const response = await axios.get(apiUrl, {
        params: {
          url: photoUrl,
          stream: false,
          apikey: "72f8161d-50d4-4177-a3b4-bd6891de70ef"
        }
      });

      const imageResult = response.data?.result;

      if (!imageResult || !imageResult.url) {
        return api.sendMessage(
          "❌ Failed to process image. Please try again later.",
          threadID,
          messageID
        );
      }

      await api.sendMessage(
        {
          body: "✅ Here's your image with the background removed!",
          attachment: await axios.get(imageResult.url, { responseType: "stream" }).then(res => res.data)
        },
        threadID,
        messageID
      );

    } catch (error) {
      console.error("❌ Error in rbg command:", error.message);
      api.sendMessage(
        `❌ An error occurred while removing background:\n${error.message}`,
        threadID,
        messageID
      );
    }
  }
};
