module.exports = {
  name: "unsend",
  author: "Aljur pogoy",
  nonPrefix: true,
  description: "Reply to a bot message to unsend it.",
  async run({ api, event }) {
    if (event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID()) {

      try {
        await api.unsendMessage(event.messageReply.messageID);
      } catch (error) {
        try {
          await api.deleteMessage(event.messageReply.messageID);
        } catch (deleteError) {
          // Do nothing. :)
        }

      }

    }

  },

};