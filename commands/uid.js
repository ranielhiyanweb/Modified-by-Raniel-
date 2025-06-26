// sorry for pterodactyl 

const axios = require("axios");

module.exports = {

  name: "uid",
  nonPrefix:true,

  version: "2.2.0",

  category: "Utility",

  description: "Get UID from Facebook link, tag, reply or yourself",

  usage: "#uid [link/@tag/reply]",

  author: "Aljur Pogoy",

  async run({ api, event, args }) {

    const { threadID, senderID, messageID, messageReply, mentions } = event;

    const isFacebookLink = (str) => str && str.includes("facebook.com");

    if (args[0] && isFacebookLink(args[0])) {

      const link = args[0];

      try {

        const res = await axios.get(`https://kaiz-apis.gleeze.com/api/fbuid?url=${encodeURIComponent(link)}`);

        const data = res.data;

        if (!data || !data.UID) {

          return api.sendMessage(`❌ Failed to get UID.\nLink: ${link}`, threadID, messageID);

        }

        const result = `====『 𝗨𝗜𝗗 𝗙𝗥𝗢𝗠 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗟𝗜𝗡𝗞 』====\n\n• UID: ${data.UID}\n• Link: ${link}\n\n> Powered by Aljur Pogoy`;

        return api.sendMessage(result, threadID, messageID);

      } catch (err) {

        console.error("UID API error:", err.message);

        return api.sendMessage("❌ An error occurred while fetching UID data.", threadID, messageID);

      }

    }

    // Handle mention, reply, or self

    let targetID, targetName;

    if (Object.keys(mentions).length > 0) {

      targetID = Object.keys(mentions)[0];

      targetName = mentions[targetID];

    } else if (messageReply) {

      targetID = messageReply.senderID;

      targetName = "the replied user";

    } else {

      targetID = senderID;

      targetName = "you";

    }

    return api.sendMessage(

      `====『 𝗨𝗦𝗘𝗥 𝗨𝗜𝗗 』====\n\n• Target: ${targetName}\n• UID: ${targetID}\n\n> Use '#uid <fb link>' to fetch UID from a profile link.`,

      threadID,

      messageID

    );

  },

};