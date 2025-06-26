import axios from "axios";

/* defined shadowBot ts :) */

namespace ShadowBot {
  export interface Command {
    config: {
      name: string;
      description: string;
      usage: string;
      nonPrefix: boolean;
    };
    run: (context: { api: any; event: any; args: string[] }) => Promise<void>;
  }
}

const aiCommand: ShadowBot.Command = {
  config: {
    name: "ai",
    description: "Interact with the Gemini API for conversational responses.",
    usage: "ai <query>",
    nonPrefix: true,
  },
  run: async ({ api, event, args }: { api: any; event: any; args: string[] }) => {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ").trim();

    if (!query) {
      return api.sendMessage("Please provide a query. Usage: /ai <query>", threadID, messageID);
    }

    try {
      const response = await axios.get("https://cid-kagenou-api.onrender.com/api/gemini", {
        params: {
          p: query,
        },
      });
      const geminiResponse = response.data.result || "No response from Gemini API.";
      const message = `${geminiResponse}\n\nReply to this message to continue the conversation.`;

      let sentMessageID: string;
      await new Promise((resolve, reject) => {
        api.sendMessage(message, threadID, (err, messageInfo) => {
          if (err) {
            console.error("Error sending Gemini message:", err);
            reject(err);
          } else {
            sentMessageID = messageInfo.messageID;
            resolve(messageInfo);
          }
        }, messageID);
      });
      if (!global.Kagenou.replyListeners) {
        global.Kagenou.replyListeners = new Map();
      }
      const handleReply = async (ctx: { api: any; event: any; data?: any }) => {
        const { api, event } = ctx;
        const { threadID, messageID } = event;
        const userReply = event.body?.trim() || "";

        try {
          const followUpResponse = await axios.get("https://cid-kagenou-api.onrender.com/api/gemini", {
            params: {
              p: userReply,
            },
          });
          const newGeminiResponse = followUpResponse.data.result || "No response from Gemini API.";
          const newMessage = `${newGeminiResponse}\n\nReply to this message to continue the conversation.`;

          let newSentMessageID: string;
          await new Promise((resolve, reject) => {
            api.sendMessage(newMessage, threadID, (err, newMessageInfo) => {
              if (err) {
                console.error("Error sending follow-up Gemini message:", err);
                reject(err);
              } else {
                newSentMessageID = newMessageInfo.messageID;
                resolve(newMessageInfo);
              }
            }, messageID);
          });
          global.Kagenou.replyListeners.set(newSentMessageID, { callback: handleReply });
        } catch (error) {
          console.error("Error in Gemini reply:", error);
          api.sendMessage("An error occurred while processing your reply with Gemini API.", threadID, messageID);
        }
      };
      global.Kagenou.replyListeners.set(sentMessageID, { callback: handleReply });
    } catch (error) {
      console.error("Error querying Gemini API:", error);
      api.sendMessage("An error occurred while contacting the Gemini API.", threadID, messageID);
    }
  },
};

export default aiCommand;
