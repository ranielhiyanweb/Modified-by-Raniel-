const fs = require("fs-extra");
const path = require("path");
module.exports = {
  name: "daily",
  author: "Aljur Pogoy",
  description: "Claim your daily reward of 500 coins! (Once every 24 hours)",
  version: "3.0.0",
  usage: "<prefix>daily",
  async run({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    try {
      let user = usersData.get(senderID) || { balance: 0, bank: 0, lastDaily: 0 };
      user.balance = user.balance || 0;
      user.bank = user.bank || 0;
      user.lastDaily = user.lastDaily || 0;
      usersData.set(senderID, user);
      const now = Date.now();
      const timeSinceLastClaim = now - user.lastDaily;
      const cooldown = 24 * 60 * 60 * 1000;
      if (timeSinceLastClaim < cooldown) {
        const remainingTime = cooldown - timeSinceLastClaim;
        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        let cooldownMessage = "⏳ 『 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 』 ⏳\n\n";
        cooldownMessage += `❌ You already claimed your daily reward!\n`;
        cooldownMessage += `⏰ Please wait ${hours}h ${minutes}m ${seconds}s to claim again.`;
        return api.sendMessage(cooldownMessage, threadID, messageID);
      }
      const reward = 500;
      const bonus = 2000;
      user.balance += reward + bonus;
      user.lastDaily = now;
      usersData.set(senderID, user);
      let successMessage = " 『 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 』 \n\n";
      successMessage += `✅ You claimed your daily reward!\n`;
      successMessage += `💰 Reward: ${reward} coins\n`;
      successMessage += `✨ Bonus from ownirsV2 company you got ${bonus} Congrats 🥀\n`;
      successMessage += `🏦 New Balance: ${user.balance} coins\n\n`;
      successMessage += `⏰ Come back in 24 hours for your next reward!`;
      await api.sendMessage(successMessage, threadID, messageID);
    } catch (error) {
      console.error("『 🌙 』 Error in daily command:", error);
      let errorMessage = "⏳ 『 𝗗𝗔𝗜𝗟𝗬 �_R𝗘𝗪𝗔𝗥𝗗 』 ⏳\n\n";
      errorMessage += `❌ An error occurred while processing your daily reward.\n`;
      api.sendMessage(errorMessage, threadID, messageID);
    }
  },
};
