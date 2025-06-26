const fs = require("fs");
module.exports = {
  name: "admin",
  author: "Aljur pogoy",
  nonPrefix: false,
  description: "Manage admin list. Usage: #admin list | #admin add <uid> <role> | #admin remove <uid>",
  async run({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
    let admins = Array.isArray(config.admins) ? [...config.admins] : [];
    let moderators = Array.isArray(config.moderators) ? [...config.moderators] : [];
    let developers = Array.isArray(config.developers) ? [...config.developers] : [];
    const userId = String(senderID);
    const isDeveloper = developers.includes(userId);
    if (!isDeveloper) {
      return api.sendMessage("❌ Only developers can use this command.", threadID, messageID);
    }
    const args = body.split(" ").slice(1);
    const subCommand = args[0]?.toLowerCase();
    if (!subCommand || subCommand === "list") {
      const getUserNames = async (uids) => {
        if (!Array.isArray(uids) || uids.length === 0) return "None";
        const names = [];
        for (const uid of uids) {
          try {
            const userInfo = await api.getUserInfo([uid]);
            const name = userInfo[uid]?.name || "Unknown";
            names.push(`— ${name}\nUID: ${uid}`);
          } catch (error) {
            names.push(`— Unknown\nUID: ${uid}`);
          }
        }
        return names.join("\n");
      };
      let message = "════『 ADMIN LIST 』════\n\n";
      message += "👑 Developers:\n" + (await getUserNames(developers)) + "\n\n";
      message += "🛡️ Moderators:\n" + (await getUserNames(moderators)) + "\n\n";
      message += "⚖️ Admins:\n" + (await getUserNames(admins));
      return api.sendMessage(message, threadID, messageID);
    }
    if (subCommand === "add") {
      let uid, role;
      if (messageReply) {
        uid = messageReply.senderID;
        role = parseInt(args[1]) || 1;
      } else {
        if (args.length < 2) {
          return api.sendMessage("❌ Usage: #admin add <uid> <role> (or reply to a user)", threadID, messageID);
        }
        uid = args[1];
        role = parseInt(args[2]) || 1;
      }
      if (role < 1 || role > 3) {
        return api.sendMessage("❌ Role must be 1 (admin), 2 (moderator), or 3 (developer).", threadID, messageID);
      }
      if (admins.includes(String(uid)) || moderators.includes(String(uid)) || developers.includes(String(uid))) {
        return api.sendMessage(`❌ UID ${uid} is already in the admin list.`, threadID, messageID);
      }
      if (role === 3) developers.push(String(uid));
      else if (role === 2) moderators.push(String(uid));
      else admins.push(String(uid));
      config.admins = admins;
      config.moderators = moderators;
      config.developers = developers;
      fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
      const userInfo = await api.getUserInfo([uid]);
      const name = userInfo[uid]?.name || "Unknown";
      return api.sendMessage(`✅ Added ${name} (UID: ${uid}) as ${role === 3 ? "Developer" : role === 2 ? "Moderator" : "Admin"} (role ${role}).`, threadID, messageID);
    }
    if (subCommand === "remove") {
      if (args.length < 2) {
        return api.sendMessage("❌ Usage: #admin remove <uid>", threadID, messageID);
      }
      const uid = args[1];
      if (!admins.includes(String(uid)) && !moderators.includes(String(uid)) && !developers.includes(String(uid))) {
        return api.sendMessage(`❌ UID ${uid} is not in the admin list.`, threadID, messageID);
      }
      admins = admins.filter(a => a !== String(uid));
      moderators = moderators.filter(m => m !== String(uid));
      developers = developers.filter(d => d !== String(uid));
      config.admins = admins;
      config.moderators = moderators;
      config.developers = developers;
      fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
      const userInfo = await api.getUserInfo([uid]);
      const name = userInfo[uid]?.name || "Unknown";
      return api.sendMessage(`✅ Removed ${name} (UID: ${uid}) from the admin list.`, threadID, messageID);
    }
    api.sendMessage("❌ Invalid subcommand. Use: #admin list | add <uid> <role> | remove <uid>", threadID, messageID);
  },
};
