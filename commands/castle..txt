import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";
module.exports = {
  config: {
    name: "castle",
    description: "Displays a stylish castle message",
    role: 0,
    cooldown: 5,
    aliases: ["fort", "keep"],
  },
  async run({ api, event, args }) {
    try {
      console.log("Event object:", event);
      const { threadID, messageID } = event;
      if (!threadID) {
        console.error("[AURORA] threadID is missing from event:", event);
        await api.sendMessage("Error: Unable to determine thread!", threadID, messageID);
        return;
      }
      const content = args.length > 0 ? args.join(" ") : "A castle";
      const message = AuroraBetaStyler.format({
        title: "Castle",
        emoji: "🏰",
        titlefont: "italic",
        content: content,
        contentfont: "fancy",
        footer: "Developed By **Aljur pogoy** ***Special***",
      });
      await api.sendMessage(message, threadID, messageID);
    } catch (error) {
    }
  },
};
