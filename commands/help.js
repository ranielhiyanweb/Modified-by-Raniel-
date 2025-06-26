const fs = require("fs");
const path = require("path");
module.exports = {
  name: "help",
  category: "Utility",
  description: "Displays all available commands or detailed info about a specific command",
  author: "Cid Kagenou",
  nonPrefix: false,
  version: "4.0",
  usage: "help or help <command> or help <page>",
  execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {
    const { threadID, messageID } = event;
    const commandsDir = path.join(__dirname, "..", "commands");
    if (!fs.existsSync(commandsDir)) {
      console.error("❌ Commands directory not found:", commandsDir);
      sendMessage(api, { threadID, message: "❌ Error: Commands directory not found." });
      return;
    }
    let commandList = [];
    let eventList = [];
    try {
      const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith(".js"));
      commandFiles.forEach((file) => {
        const commandPath = path.join(commandsDir, file);
        try {
          const command = require(commandPath);
          const commandName = file.replace(".js", "");
          if (typeof command !== "object" || !command.name) {
            console.warn(`⚠️ Skipping invalid command file: ${file}`);
            return;
          }
          if (command.handleEvent) {
            eventList.push(`『 ${commandName} 』\n`);
          } else {
            commandList.push(`『 ${commandName} 』\n`);
          }
        } catch (cmdError) {
          console.error(`❌ Error loading command: ${file}`, cmdError);
        }
      });
    } catch (error) {
      console.error("❌ Error reading commands directory:", error);
      sendMessage(api, { threadID, message: "❌ Error loading command list." });
      return;
    }
    if (args.length > 0 && isNaN(parseInt(args[0]))) {
      const commandName = args[0].toLowerCase();
      const commandPath = path.join(commandsDir, `${commandName}.js`);
      if (!fs.existsSync(commandPath)) {
        sendMessage(api, { threadID, message: `❌ Command "${commandName}" not found.` });
        return;
      }
      try {
        const command = require(commandPath);
        if (typeof command !== "object" || !command.name) {
          sendMessage(api, { threadID, message: `❌ Invalid command: ${commandName}` });
          return;
        }
        let detailedHelp = "════『 COMMAND INFO 』════\n\n";
        detailedHelp += "📋 『 Name 』\n";
        detailedHelp += `${command.name || "N/A"}\n\n`;
        detailedHelp += "📂 『 Category 』\n";
        detailedHelp += `${command.category || "N/A"}\n\n`;
        detailedHelp += "📝 『 Description 』\n";
        detailedHelp += `${command.description || "No description available"}\n\n`;
        detailedHelp += "✍️ 『 Author 』\n";
        detailedHelp += `${command.author || "Cid Kagenou"}\n\n`;
        detailedHelp += "🔖 『 Version 』\n";
        detailedHelp += `${command.version || "1.0"}\n\n`;
        detailedHelp += "🛠️ 『 Usage 』\n";
        detailedHelp += `${command.usage || `${prefix}${command.name}`}\n\n`;
        detailedHelp += `> Thank you for using Cid Kagenou bot! \n`;
        detailedHelp += `> For further assistance, contact: korisawaumuzaki@gmail.com`;
        sendMessage(api, { threadID, message: detailedHelp });
        return;
      } catch (error) {
        console.error(`❌ Error loading command: ${commandName}`, error);
        sendMessage(api, { threadID, message: `❌ Error loading command: ${commandName}` });
        return;
      }
    }
    const commandsPerPage = 10;
    const totalCommands = commandList.length;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);
    const page = args.length > 0 && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 1;
    if (page < 1 || page > totalPages) {
      sendMessage(api, { threadID, message: `❌ Invalid page number. Please use a page between 1 and ${totalPages}.` });
      return;
    }
    const startIndex = (page - 1) * commandsPerPage;
    const endIndex = Math.min(startIndex + commandsPerPage, totalCommands);
    const paginatedCommands = commandList.slice(startIndex, endIndex);
    let helpMessage = "════『 HELP MENU 』════📜\n";
    helpMessage += "      『 COMMANDS LIST 』\n\n";
    if (paginatedCommands.length > 0) {
      helpMessage += paginatedCommands.join("");
    } else {
      helpMessage += "No commands available on this page.\n";
    }
    if (page === 1 && eventList.length > 0) {
      helpMessage += "\n════『 EVENT COMMANDS 』════\n\n";
      helpMessage += eventList.join("");
    }
    helpMessage += `\n\n📄 Page ${page}/${totalPages}\n`;
    helpMessage += totalPages > 1 ? `> Type ${prefix}help <page> to see more (e.g., ${prefix}help 2).\n` : "";
    helpMessage += `\n> Type ${prefix}help <command> for more details.\n`;
    helpMessage += `\n> Enjoy using the bot!`;
    api.shareContact(helpMessage, api.getCurrentUserID(), threadID);
  },
};
