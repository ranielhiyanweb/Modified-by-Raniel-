const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "say",
    nonPrefix: true,
    description: "Convert text to speech and send as an audio message.",
    usage: "say <message>",
    category: "fun",
    version: "4.0.0",
    async run({ api, event, args }) {
        if (!args.length) return api.sendMessage("Please provide a message to convert into speech.", event.threadID);
        
        const messageContent = args.join(" ");
        const audioPath = path.join(__dirname, "say.mp3");
        try {
            const response = await axios({
                method: "GET",
                url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(messageContent)}&tl=en&client=tw-ob`,
                responseType: "stream"
            });
            const writeStream = fs.createWriteStream(audioPath);
            response.data.pipe(writeStream);

            writeStream.on("finish", () => {
                api.sendMessage({ attachment: fs.createReadStream(audioPath) }, event.threadID, () => {
                    fs.unlinkSync(audioPath);
                });
            });

            writeStream.on("error", (err) => {
                console.error(err);
                return api.sendMessage("❌ Failed to write audio to file.", event.threadID);
            });
        } catch (err) {
            console.error(err);
            return api.sendMessage("❌ Failed to generate speech audio.", event.threadID);
        }
    }
};