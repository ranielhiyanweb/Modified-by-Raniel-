const fs = require("fs");
const path = require("path");

module.exports = {
  name: "joinNoti",
  version: "2.1.0",
  description: "Custom join notification with video and message",
  author: "Modified by Raniel",
  async onEvent({ api, event, prefix }) {
    const { logMessageType, logMessageData, threadID } = event;

    if (logMessageType !== "log:subscribe") return;

    try {
      const currentUserID = await api.getCurrentUserID();
      const threadInfo = await api.getThreadInfo(threadID);
      const { addedParticipants } = logMessageData;
      const participantNames = addedParticipants.map(i => i.fullName).join(", ");
      const isBotAdded = addedParticipants.some(i => i.userFbId === currentUserID);
      const memberCount = threadInfo.participantIDs.length;

      const welcomeMessage = isBotAdded
        ? `
┌───────────────┐
│ 🤖 Raniela's Bot │
└───────────────┘

✨ Successfully Connected!

📌 Prefix: ${prefix}
📁 Type '${prefix}help' for commands
🎬 Try sending a video or say 'hi'

──────────────────────
🌟 Ready to assist 24/7!
`
        : `
┌──────────────────────────────┐
│     🎉 WELCOME ABOARD!        │
└──────────────────────────────┘

👋 Hello ${participantNames}!
🏠 Group: ${threadInfo.name}
👥 Member #${memberCount}
📅 ${new Date().toLocaleDateString()}

💬 Say hi and enjoy the bot!
📚 Type "${prefix}help" to explore commands
`;

      const welcomeDir = path.join(__dirname, "cache", "welcome");

      fs.readdir(welcomeDir, (err, files) => {
        if (err || !files.length) {
          return api.sendMessage(welcomeMessage, threadID);
        }

        const videoFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return [".mp4", ".mov", ".avi", ".mkv"].includes(ext);
        });

        if (!videoFiles.length) {
          return api.sendMessage(welcomeMessage, threadID);
        }

        const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
        const videoPath = path.join(welcomeDir, randomVideo);

        api.sendMessage(
          {
            body: welcomeMessage,
            attachment: fs.createReadStream(videoPath)
          },
          threadID
        );
      });

      if (isBotAdded) {
        await api.changeNickname(`[ ${prefix} ]: Raniela's Bot`, threadID, currentUserID);
      }

    } catch (error) {
      console.error("❌ Error in joinNoti:", error.message);
      api.sendMessage("⚠️ Error handling join notification.", threadID);
    }
  }
};
