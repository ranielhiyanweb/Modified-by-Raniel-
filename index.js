/**
 * @author Aljur pogoy
 * Thank you for using our Botfile ✨
 * This botfile was developed since 2024, December.
 */


require("ts-node").register();
require("./core/global");
const { MongoClient } = require("mongodb");
const fs = require("fs-extra");
const path = require("path");
const login = require("fbvibex");
/*
const apiHandler = require("./utils/apiHandler");
*/
const { handleAuroraCommand, loadAuroraCommands } = require("./core/aurora");
loadAuroraCommands();
const commands = new Map();
const nonPrefixCommands = new Map();
const eventCommands = [];
const usersData = new Map();
const globalData = new Map();
const commandsDir = path.join(__dirname, "commands");
const bannedUsersFile = path.join(__dirname, "database", "bannedUsers.json");
const configFile = path.join(__dirname, "config.json");
const globalDataFile = path.join(__dirname, "database", "globalData.json");
let bannedUsers = {};
let config = { admins: [], moderators: [], developers: [], Prefix: ["/"], botName: "Shadow Garden Bot", mongoUri: null };
global.disabledCommands = new Map();
process.on("unhandledRejection", console.error.bind(console));
process.on("exit", () => fs.writeFileSync(globalDataFile, JSON.stringify([...globalData])));
global.userCooldowns = new Map();
const reloadCommands = () => {
  commands.clear();
  nonPrefixCommands.clear();
  eventCommands.length = 0;
  loadCommands();
};
global.reloadCommands = reloadCommands;
global.threadState = { active: new Map(), approved: new Map(), pending: new Map() };
global.client = { reactionListener: {}, globalData: new Map() };
global.Kagenou = { autodlEnabled: false, replies: {} };
if (fs.existsSync(globalDataFile)) {
  const data = JSON.parse(fs.readFileSync(globalDataFile));
  for (const [key, value] of Object.entries(data)) globalData.set(key, value);
}
const loadBannedUsers = () => {
  try {
    bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFile, "utf8"));
  } catch {
    bannedUsers = {};
  }
};
function getUserRole(uid) {
  uid = String(uid);
  if (config.developers.includes(uid)) return 3;
  if (config.moderators.includes(uid)) return 2;
  if (config.admins.includes(uid)) return 1;
  return 0;
}
async function handleReply(api, event) {
  const replyData = global.Kagenou.replies[event.messageReply?.messageID];
  if (!replyData) return;
  if (replyData.author && event.senderID !== replyData.author) {
    return api.sendMessage("Only the original sender can reply to this message.", event.threadID, event.messageID);
  }
  try {
    await replyData.callback({ ...event, event, api, attachments: event.messageReply?.attachments || [], data: replyData });
    console.log(`[REPLY] Processed reply for messageID: ${event.messageReply?.messageID}, command: ${replyData.callback.name || "unknown"}`);
  } catch (err) {
    console.error(`[REPLY ERROR] Failed to process reply for messageID: ${event.messageReply?.messageID}:`, err);
    api.sendMessage(`An error occurred while processing your reply: ${err.message}`, event.threadID, event.messageID);
  }
}
const loadCommands = () => {
  const retroGradient = require("gradient-string").retro;
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
  for (const file of commandFiles) {
    try {
      const commandPath = path.join(commandsDir, file);
      delete require.cache[require.resolve(commandPath)];
      const commandModule = require(commandPath);
      const command = commandModule.default || commandModule;
      if (command.config && command.config.name && command.run) {
        commands.set(command.config.name.toLowerCase(), command);
        if (command.config.aliases) command.config.aliases.forEach(alias => commands.set(alias.toLowerCase(), command));
        if (command.config.nonPrefix) nonPrefixCommands.set(command.config.name.toLowerCase(), command);
      } else if (command.name) {
        commands.set(command.name.toLowerCase(), command);
        if (command.aliases) command.aliases.forEach(alias => commands.set(alias.toLowerCase(), command));
        if (command.nonPrefix) nonPrefixCommands.set(command.name.toLowerCase(), command);
      }
      if (command.handleEvent) eventCommands.push(command);
    } catch (error) {
      console.error(`Error loading command '${file}':`, error);
    }
  }
  console.log(retroGradient(`[ MAIN SYSTEM COMMANDS ]: ${commands.size}`));
  console.log(retroGradient(`Non-Prefix Commands: ${nonPrefixCommands.size}`));
  console.log(retroGradient(`Event Commands: ${eventCommands.length}`));
  console.log(retroGradient("[ INFO ] Setup Complete!"));
};
loadCommands();
let appState = {};
try {
  appState = JSON.parse(fs.readFileSync("./appstate.dev.json", "utf8"));
} catch (error) {
  console.error("Error loading appstate.json:", error);
}
try {
  const configData = JSON.parse(fs.readFileSync(configFile, "utf8"));
  console.log("[CONFIG] Loaded config.json:", configData);
  config = {
    admins: configData.admins || [],
    moderators: configData.moderators || [],
    developers: configData.developers || [],
    Prefix: Array.isArray(configData.Prefix) && configData.Prefix.length > 0 ? configData.Prefix : ["/"],
    botName: configData.botName || "Shadow Garden Bot",
    mongoUri: configData.mongoUri || null,
    ...configData,
  };
} catch (error) {
  console.error("[CONFIG] Error loading config.json:", error);
  config = { admins: [], moderators: [], developers: [], Prefix: ["/"], botName: "Shadow Garden Bot", mongoUri: null };
}
let db = null;
const uri = config.mongoUri || null;
console.log("[DB] MongoDB URI:", uri);
if (uri) {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  const cidkagenou = {
    db: function (collectionName) {
      return client.db("chatbot_db").collection(collectionName);
    },
  };
  async function connectDB() {
    try {
      console.log("[DB] Attempting to connect to MongoDB...");
      await client.connect();
      console.log("[DB] Connected to MongoDB successfully with URI:", uri);
      db = cidkagenou;
      global.db = db;
      const usersCollection = db.db("users");
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(user => usersData.set(user.userId, user.data));
      console.log("[DB] Synced usersData with MongoDB users.");
    } catch (err) {
      console.error("[DB] MongoDB connection error, falling back to JSON:", err);
      db = null;
      global.db = null;
    }
  }
  connectDB();
} else {
  console.log("[DB] No mongoUri in config.json, falling back to JSON storage. Config:", config);
  db = null;
  global.db = null;
}
loadBannedUsers();
const setCooldown = (userID, commandName, cooldown) => {
  const key = `${userID}:${commandName}`;
  global.userCooldowns.set(key, Date.now() + cooldown * 1000);
};
const checkCooldown = (userID, commandName, cooldown) => {
  const key = `${userID}:${commandName}`;
  const expiry = global.userCooldowns.get(key);
  if (expiry && Date.now() < expiry) {
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    return `Please wait ${remaining} second(s) before using '${commandName}' again.`;
  }
  return null;
};
const sendMessage = async (api, messageData) => {
  try {
    const { threadID, message, replyHandler, messageID, senderID } = messageData;
    if (!threadID || (typeof threadID !== "number" && typeof threadID !== "string" && !Array.isArray(threadID))) {
      throw new Error("ThreadID must be a number, string, or array and cannot be undefined.");
    }
    if (!message || message.trim() === "") return;
    return new Promise((resolve, reject) => {
      api.sendMessage(message, threadID, (err, info) => {
        if (err) {
          console.error("Error sending message:", err);
          return reject(err);
        }
        if (replyHandler && typeof replyHandler === "function") {
          global.Kagenou.replies[info.messageID] = { callback: replyHandler, author: senderID };
          setTimeout(() => delete global.Kagenou.replies[info.messageID], 300000);
        }
        resolve(info);
      }, messageID || null);
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};
const handleMessage = async (api, event) => {
  const { threadID, senderID, body, messageReply, messageID } = event;
  if (!body) return;
  const message = body.trim();
  const words = message.split(/ +/);
  let prefixes = config.Prefix;
  loadBannedUsers();
  if (bannedUsers[senderID]) {
    return api.sendMessage(`You are banned from using bot commands.\nReason: ${bannedUsers[senderID].reason}`, threadID);
  }
  if (messageReply && global.Kagenou.replies && global.Kagenou.replies[messageReply.messageID]) {
    return handleReply(api, event);
  }
  let commandName = words[0].toLowerCase();
  let args = words.slice(1);
  let command = null;
  let prefix = config.Prefix[0];
  for (const prefix of prefixes) {
    if (message.startsWith(prefix)) {
      commandName = message.slice(prefix.length).split(/ +/)[0].toLowerCase();
      args = message.slice(prefix.length).split(/ +/).slice(1);
      command = commands.get(commandName);
      if (command && command.nonPrefix && message === commandName) command = null;
      break;
    }
  }
  if (!command) {
    command = nonPrefixCommands.get(commandName);
  }
  if (command) {
    const userRole = getUserRole(senderID);
    const commandRole = command.role || 0;
    if (userRole < commandRole) {
      return api.sendMessage(
        ` You do not have permission to use this command. Required role: ${commandRole} (0=Everyone, 1=Admin, 2=Moderator, 3=Developer), your role: ${userRole}.`,
        threadID,
        messageID
      );
    }
    const disabledCommandsList = global.disabledCommands.get("disabled") || [];
    if (disabledCommandsList.includes(commandName)) {
      return api.sendMessage(`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} Command has been disabled.`, threadID, messageID);
    }
    const cooldown = command.cooldown || 0;
    const cooldownMessage = checkCooldown(senderID, commandName, cooldown || 3);
    if (cooldownMessage) return sendMessage(api, { threadID, message: cooldownMessage, messageID });
    setCooldown(senderID, commandName, cooldown || 3);
    try {
      if (command.execute) {
        await command.execute(api, event, args, commands, prefix, config.admins, appState, sendMessage, usersData, globalData);
      } else if (command.run) {
        await command.run({ api, event, args,  usersData, globalData, admins: config.admins, prefix: prefix, db, commands });
    /*  } else if (command.config && command.config.onStart) {
        await command.config.onStart({
          api,
          event,
          args,
          message: {
            reply: (text, callback) => api.sendMessage(text, event.threadID, callback, event.messageID)
          } 
          }); */
      }
      if (db && usersData.has(senderID)) {
        const usersCollection = db.db("users");
        const userData = usersData.get(senderID) || {};
        await usersCollection.updateOne(
          { userId: senderID },
          { $set: { userId: senderID, data: userData } },
          { upsert: true }
        );
        console.log(`[DB] Synced user ${senderID} data to MongoDB.`);
      }
    } catch (error) {
      console.error(`Failed to execute command '${commandName}':`, error);
      sendMessage(api, { threadID, message: `Error executing command '${commandName}': ${error.message}` });
    }
  } else if (message.startsWith(config.Prefix[0])) {
    sendMessage(api, { threadID, message: `Invalid Command!, Use ${config.Prefix[0]}help for available commands.`, messageID });
  }
};
async function handleReaction(api, event) {
  const { threadID, reaction, messageID, senderID } = event;
  for (const command of commands.values()) {
    if (command.handleReaction) {
      try {
        await command.handleReaction({ api, event, reaction, threadID, messageID, senderID });
        console.log(`[REACTION] Processed reaction for command: ${command.config?.name || "unknown"}`);
      } catch (error) {
        console.error(`[REACTION] error:`, error);
        api.sendMessage(`Error processing reaction: ${error.message}`, threadID, messageID);
      }
    } else if (command.config && command.config.onReaction) {
      const reactionData = global.Kagenou.replies[event.messageID] || {};
      if (reactionData.author === event.senderID) {
        try {
          await command.config.onReaction({
            message: { reply: (text) => api.sendMessage(text, event.threadID) },
            event,
            Reaction: reactionData,
          });
          delete global.Kagenou.replies[event.messageID];
        } catch (error) {
          console.error(`[REACTION ERROR] Failed to process reaction for '${command.config.name}':`, error);
          api.sendMessage(`Error processing reaction: ${error.message}`, event.threadID, messageID);
        }
      }
    }
  }
}
const handleEvent = async (api, event) => {
  for (const command of eventCommands) {
    try {
      if (command.handleEvent) await command.handleEvent({ api, event });
    } catch (error) {
      console.error(`Error in event command '${command.config?.name || command.name}':`, error);
    }
  }
};
const { preventBannedResponse } = require("./commands/thread");
const startListeningForMessages = (api) => {
  return api.listenMqtt(async (err, event) => {
    if (err) {
      console.error("Error listening for messages:", err);
      return;
    }
    try {
      let proceed = true;
      if (global.db) {
        const bannedThreadsCollection = global.db.db("bannedThreads");
        const result = await bannedThreadsCollection.findOne({ threadID: event.threadID.toString() });
        if (result) {
          proceed = false;
        }
      }
      if (proceed) {
        if (event.type === "message_reply" && event.messageReply) {
          if (global.Kagenou.replies[event.messageReply.messageID]) {
            await handleReply(api, event);
            return;
          }
          await handleEvent(api, event);
          await handleMessage(api, event);
        }
        if (["message"].includes(event.type)) {
          await handleEvent(api, event);
          await handleMessage(api, event);
          handleAuroraCommand(api, event);
        }
        if (event.type === "event" && event.logMessageType === "log:subscribe") {
          const threadID = event.threadID;
          const addedUsers = event.logMessageData.addedParticipants || [];
          console.log("Added participants:", addedUsers);
          console.log("Bot's user ID:", api.getCurrentUserID());
          const botWasAdded = addedUsers.some(user => user.userFbId === api.getCurrentUserID());
          if (botWasAdded) {
            console.log(`Bot was added to thread ${threadID}`);
            if (db) {
              try {
                const threadInfo = await api.getThreadInfo(threadID);
                const threadName = threadInfo.name || `Unnamed Thread (ID: ${threadID})`;
                await db.db("threads").updateOne(
                  { threadID },
                  { $set: { threadID, name: threadName } },
                  { upsert: true }
                );
                console.log(`[ThreadList] Saved thread ${threadID}: ${threadName} to MongoDB`);
              } catch (error) {
                console.error(`[ThreadList] Failed to save thread ${threadID} to MongoDB:`, error);
              }
            } else {
              console.warn("[ThreadList] Database not initialized, cannot save thread info");
            }
            if (
              !global.threadState.active.has(threadID) &&
              !global.threadState.approved.has(threadID) &&
              !global.threadState.pending.has(threadID)
            ) {
              global.threadState.pending.set(threadID, { addedAt: new Date() });
              console.log(`Added thread ${threadID} to pending state`);
              api.sendMessage(`Thank you for inviting me here! ThreadID: ${threadID}`, threadID);
              try {
                await api.changeNickname(config.botName, threadID, api.getCurrentUserID());
                console.log(`Nickname changed to ${config.botName} in thread ${threadID}`);
              } catch (error) {
                console.error(`Failed to change nickname in thread ${threadID}:`, error);
              }
            }
          }
        }
        if (event.type === "message_reaction") {
          await handleReaction(api, event);
        }
        if (event.type === "message" && event.body && event.body.startsWith(config.Prefix[0])) {
          const words = event.body.trim().split(/ +/);
          const commandName = words[0].slice(config.Prefix[0].length).toLowerCase();
          const args = words.slice(1);
          if (commandName === "approve" && config.admins.includes(event.senderID)) {
            if (args[0] && args[0].toLowerCase() === "pending") return;
            if (args.length > 0) {
              const targetThreadID = args[0].trim();
              if (/^\d+$/.test(targetThreadID) || /^-?\d+$/.test(targetThreadID)) {
                if (global.threadState.pending.has(targetThreadID)) {
                  global.threadState.pending.delete(targetThreadID);
                  global.threadState.approved.set(targetThreadID, { approvedAt: new Date() });
                  console.log(`Approved thread ${targetThreadID}`);
                  api.sendMessage(`Thread ${targetThreadID} has been approved.`, event.threadID);
                } else if (!global.threadState.approved.has(targetThreadID)) {
                  global.threadState.approved.set(targetThreadID, { approvedAt: new Date() });
                  console.log(`Directly approved thread ${targetThreadID}`);
                  api.sendMessage(`Thread ${targetThreadID} has been approved.`, event.threadID);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in message listener:", error);
    }
  });
};
const startListeningWithAutoRestart = (api) => {
  let stopListener = null;
  const startListener = () => {
    if (stopListener) {
      stopListener();
      console.log("Stopped previous listener to prevent duplicates.");
    }
    try {
      stopListener = startListeningForMessages(api);
      console.log("Started new listener.");
    } catch (err) {
      console.error("Failed to start listener, retrying in 5 seconds:", err);
      setTimeout(startListener, 5000);
    }
  };
  startListener();
  setInterval(() => {
    console.log("Scheduled listener restart...");
    startListener();
  }, 3600000);
};
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard', 'public')));
const startBot = async () => {
  login({ appState }, (err, api) => {
    if (err) {
      console.error("Fatal error during Facebook login:", err);
      process.exit(1);
    }
    api.setOptions({
      forceLogin: true,
      listenEvents: true,
      logLevel: "silent",
      updatePresence: true,
      selfListen: false,
      bypassRegion: "pnb",
      userAgent: "ZmFjZWJvb2tleHRlcm5hbGhpdC8xLjEgKCdodHRwOi8vd3d3LmZhY2Vib29rLmNvbS9leHRlcm5hbGhpdF91YXRleHQucGhwKQ==",
      online: true,
      autoMarkDelivery: false,
      autoMarkRead: false,
    });
    global.api = api;
    startListeningWithAutoRestart(api);
    app.get('/', (req, res) => {
      const botUID = api.getCurrentUserID();
      const botName = config.botName || 'KagenouBotV3';
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>KagenouBotV3 Portfolio</title>
            <meta name="description" content="Official portfolio for KagenouBotV3.">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    margin: 0;
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #0a0f1c, #1a2a44);
                    color: #e0e0e0;
                    overflow-x: hidden;
                }
                .header {
                    background: #1a2a44;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                }
                .header h1 {
                    margin: 0;
                    font-size: 2.5em;
                    color: #00ffcc;
                    text-transform: uppercase;
                }
                .nav {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin: 20px 0;
                }
                .nav a {
                    color: #00ffcc;
                    text-decoration: none;
                    font-size: 1.2em;
                    padding: 10px 20px;
                    transition: color 0.3s;
                }
                .nav a:hover {
                    color: #ff4444;
                }
                .content {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    text-align: center;
                }
                .bot-card {
                    background: rgba(26, 42, 68, 0.9);
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(0, 255, 204, 0.2);
                }
                .bot-card h2 {
                    color: #00ffcc;
                    margin-bottom: 20px;
                }
                .bot-card p {
                    font-size: 1.1em;
                    margin: 10px 0;
                    color: #b0b0b0;
                }
                .bot-card img {
                    max-width: 150px;
                    border: 3px solid #00ffcc;
                    border-radius: 10px;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    background: #1a2a44;
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                    color: #b0b0b0;
                }
                @media (max-width: 600px) {
                    .nav {
                        flex-direction: column;
                        align-items: center;
                    }
                    .content {
                        padding: 20px 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>KagenouBotV3 Portfolio</h1>
            </div>
            <div class="nav">
                <a href="/">Home</a>
                <a href="/terms">Terms</a>
            </div>
            <div class="content">
                <div class="bot-card">
                    <h2>${botName}</h2>
                    <p>UID: ${botUID}</p>
                    <p>Status: Active</p>
                    <p>Prefix: ${config.Prefix[0] || '/'}</p>
                    <img src="https://via.placeholder.com/150" alt="Bot Profile" class="mt-3">
                </div>
            </div>
            <div class="footer">
                <p>© 2025 Kaizenji | All rights reserved.</p>
                <p>Time: <span id="time"></span> | Ping: N/A</p>
            </div>
            <script>
                function updateTime() {
                    const now = new Date();
                    document.getElementById('time').textContent = now.toLocaleTimeString();
                }
                setInterval(updateTime, 1000);
                updateTime();
            </script>
        </body>
        </html>
      `);
    });
    const dashboardPort = 3000;
    app.listen(dashboardPort, () => {
      console.log(`[DASHBOARD] Dashboard running on http://localhost:${dashboardPort}`);
    });
  });
};
startBot();

/* @Developed by Aljur pogoy 🤓☝️ */
