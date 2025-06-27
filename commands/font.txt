module.exports = {
  config: {
    name: "font",
    version: "4.0",
    author: "Aljur pogoy",
    description: "Style text with Cassidy Styler and filter bad words",
    role: 0,
    cooldown: 5,
    aliases: ["style"],
  },
  async run({ api, event, args }) {
    const { threadID, messageID } = event
    const bannedWords = ["niggers", "fuck", "shit", "asshole", "nigger", "fuck"]
    const text = args.slice(1).join(" ").trim() || ""
    const hasBannedWord = bannedWords.some(word => text.toLowerCase().includes(word.toLowerCase()))
    if (hasBannedWord) {
      return api.sendMessage("❌ Your message contains banned words. Please avoid using them.", threadID, messageID)
    }
    const { FontSystem, format, UNIRedux } = require("cassidy-styler")
    const validFonts = ["bold", "fancy", "bold_italic", "fancy_italic", "redux", "widespace", "serif", "handwriting", "scriptbold", "script", "typewriter", "none", "moody", "double_struck"]
    const font = args[0] || ""
    if (!font) {
      const fontList = validFonts.join(", ")
      return api.sendMessage(`Available fonts: ${fontList}`, threadID, messageID)
    }
    const selectedFont = validFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "bold"
    const styledText = FontSystem.applyFonts(text, selectedFont)
    api.sendMessage(styledText, threadID, messageID)
  },
};
