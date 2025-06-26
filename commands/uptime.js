// sorry for pterodactyl :0

const moment = require("moment-timezone")

const path = require("path");

const fs = require("fs-extra");

const { format, UNIRedux } = require("cassidy-styler")

module.exports = {

  name: "uptime",
  nonPrefix: true,

  description: "Displays bot statistics",

  role: 0,
  
  aliases: ["up","u"],

  async run({ api, event, db }) {

    const { threadID, messageID } = event

    try {

      const uptime = process.uptime()
      const days = Math.floor(uptime / (24 * 3600))

      const hours = Math.floor((uptime % (24 * 3600)) / 3600)

      const minutes = Math.floor((uptime % 3600) / 60)

      const seconds = Math.floor(uptime % 60)

      const milliseconds = Math.floor((uptime % 1) * 1000)

      let commandCount = global.commands?.size || 0

      if (commandCount === 0) {

        const commandsDir = path.join(__dirname, "..", "commands")

        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"))

        commandCount = commandFiles.length

      }

      if (!db) {

        throw new Error("Database not initialized. Ensure MongoDB is connected.")

      }

      const threads = await db.db("threads").find({}).toArray()

      const totalThreads = threads.length

      const currentTime = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss.SSS")

      const content = `- **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s ${milliseconds}ms\n- **Total Threads:** ${totalThreads}\n- **Total Commands**: ${commandCount}\n- **Current Time (Asia/Manila):** ${currentTime}\n\n> ***Use*** #up to refresh`

      const msg = format({

        title: "Bot Statistics",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "bold",

        contentFont: "fancy_italic",

        emojis: "📊",

        content,

      })

      await api.sendMessage(msg, threadID, messageID)

    } catch (error) {

      const errMsg = format({

        title: "Bot Statistics",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        emojis: "📊",

        content: `┏━━━━━━━┓\n┃ Error: ${error.message}\n┗━━━━━━━┛\n`,

      })

      api.sendMessage(errMsg, threadID, messageID)

    }

  },

}