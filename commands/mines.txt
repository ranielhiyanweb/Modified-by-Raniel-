import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

namespace ShadowBot {
  export interface Command {
    config: {
      name: string;
      description: string;
      usage: string;
      category?: string;
    };
    run: (context: { api: any; event: any; args: string[]; db?: { db: (collectionName: string) => any } | null }) => Promise<void>;
  }
}

interface MinerData {
  userID: string;
  name?: string;
  started?: boolean;
  exp: number;
  materials: { diamondOre: number; goldOre: number; silverOre: number };
  equipment: { pickaxe?: string; pickaxeLevel: number };
  rank: string;
}

interface ShopItem {
  cost: { diamondOre?: number; goldOre?: number; silverOre?: number };
  level?: number;
  effect?: string;
  amount?: number;
}

interface UpgradeOption {
  cost: { silverOre: number; goldOre?: number; diamondOre?: number };
  ability: string;
  level: number;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function determineRank(exp: number): string {
  if (exp >= 10000) return "S";
  if (exp >= 5000) return "A";
  if (exp >= 2500) return "B";
  if (exp >= 1000) return "C";
  if (exp >= 500) return "D";
  return "E";
}

function getCollectionMultiplier(pickaxeLevel: number): number {
  if (pickaxeLevel === 1) return 2;       // 1x → 2x
  if (pickaxeLevel === 2) return 4;       // 2x → 4x
  if (pickaxeLevel === 3) return 6;       // 3x → 6x (adjusted for diamond_pickaxe level 3)
  if (pickaxeLevel >= 7 && pickaxeLevel <= 15) return 9; // 7-15x → 9x
  if (pickaxeLevel >= 20) return 20;      // 20x (max) → 20x
  return pickaxeLevel;                    // Default to level 
}

async function saveMinerData(db: any, senderID: string, data: MinerData) {
  const minersCollection = db.db("miners");
  await minersCollection.updateOne(
    { userID: senderID },
    { $set: data },
    { upsert: true }
  );
}

async function getMinerData(db: any, senderID: string): Promise<MinerData> {
  const minersCollection = db.db("miners");
  const result = await minersCollection.findOne({ userID: senderID });
  const defaultData: MinerData = {
    userID: senderID,
    exp: 0,
    materials: { diamondOre: 0, goldOre: 0, silverOre: 0 },
    equipment: { pickaxe: undefined, pickaxeLevel: 1 },
    rank: "E",
  };
  const data = result ? { ...defaultData, ...result } : defaultData;
  data.rank = determineRank(data.exp);
  return data;
}

async function removeTradeRequest(db: any, from: string, to: string) {
  const tradeRequestsCollection = db.db("tradeRequests");
  await tradeRequestsCollection.deleteOne({ from, to });
}

const minesCommand: ShadowBot.Command = {
  config: {
    name: "mines",
    description: "Manage your mining activities, shop, and ranks.",
    usage: "/mines register <name> | /mines start | /mines profile | /mines inventory | /mines collect | /mines rest | /mines tournament | /mines shop | /mines buy <key> | /mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid> | /mines upgrade",
    category: "Games 🎮",
  },
  run: async ({ api, event, args, db }) => {
    if (!db) {
      await api.sendMessage("Database not available.", event.threadID, event.messageID);
      return;
    }
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();
    const userData = await getMinerData(db, senderID.toString());

    if (action === "register") {
      const name = args[1];
      if (!name) {
        const errorMessage = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Please provide a name. Usage: /mines register <name>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(errorMessage, threadID, messageID);
        return;
      }
      if (userData.name) {
        const alreadyRegistered = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "🛑",
          headerStyle: "bold",
          bodyText: `You are already registered as ${userData.name}. Use /mines profile to check your status.`,
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(alreadyRegistered, threadID, messageID);
        return;
      }
      userData.name = name;
      await saveMinerData(db, senderID.toString(), userData);
      const registerMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines",
        headerSymbol: "✅",
        headerStyle: "bold",
        bodyText: `Registered as ${name}. Use /mines start to begin mining!`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(registerMessage, threadID, messageID);
      return;
    }

    if (!userData.name) {
      const notRegistered = AuroraBetaStyler.styleOutput({
        headerText: "Mines",
        headerSymbol: "⚠️",
        headerStyle: "bold",
        bodyText: "You need to register first. Usage: /mines register <name>",
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(notRegistered, threadID, messageID);
      return;
    }

    if (action === "start") {
      if (userData.started) {
        const alreadyStarted = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "🛑",
          headerStyle: "bold",
          bodyText: "You’ve already started mining!",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(alreadyStarted, threadID, messageID);
        return;
      }
      userData.started = true;
      await saveMinerData(db, senderID.toString(), userData);
      const startMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines",
        headerSymbol: "⛏️",
        headerStyle: "bold",
        bodyText: "Mining has begun! Use /mines collect to start gathering resources.",
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(startMessage, threadID, messageID);
      return;
    }

    if (action === "profile") {
      const profileMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Profile",
        headerSymbol: "⛏️",
        headerStyle: "bold",
        bodyText: `Name: ${userData.name}\nEXP: ${userData.exp}\nRank: ${userData.rank}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(profileMessage, threadID, messageID);
      return;
    }

    if (action === "inventory") {
      const { diamondOre, goldOre, silverOre } = userData.materials;
      const inventoryMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Inventory",
        headerSymbol: "🛒",
        headerStyle: "bold",
        bodyText: `Materials:\n- Diamond Ore: ${diamondOre}\n- Gold Ore: ${goldOre}\n- Silver Ore: ${silverOre}\nEquipment: ${userData.equipment.pickaxe || "None"} (Level ${userData.equipment.pickaxeLevel})`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(inventoryMessage, threadID, messageID);
      return;
    }

    if (action === "collect") {
      if (!userData.started) {
        const notStarted = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "You must start mining first! Use /mines start.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(notStarted, threadID, messageID);
        return;
      }
      const equipmentLevel = userData.equipment.pickaxeLevel;
      const multiplier = getCollectionMultiplier(equipmentLevel);
      const baseDiamonds = getRandomInt(0, 6);
      const baseGold = getRandomInt(0, 10);
      const baseSilver = getRandomInt(0, 20);
      const diamonds = Math.floor(baseDiamonds * multiplier);
      const gold = Math.floor(baseGold * multiplier);
      const silver = Math.floor(baseSilver * multiplier);
      const dirtChance = Math.random() < 0.3;
      let collectMessage = "";
      if (dirtChance) {
        collectMessage = "Collected some dirt... Better luck next time!";
      } else {
        userData.materials.diamondOre += diamonds;
        userData.materials.goldOre += gold;
        userData.materials.silverOre += silver;
        await saveMinerData(db, senderID.toString(), userData);
        collectMessage = `Collected ${diamonds} diamond${diamonds !== 1 ? "s" : ""} ore${diamonds ? "," : ""} ${gold} gold${gold !== 1 ? "s" : ""} ore${gold ? "," : ""} ${silver} silver${silver !== 1 ? "s" : ""} ore! (x${multiplier} multiplier)`;
      }
      const collectResult = AuroraBetaStyler.styleOutput({
        headerText: "Mines Collect",
        headerSymbol: "⛏️",
        headerStyle: "bold",
        bodyText: collectMessage,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(collectResult, threadID, messageID);
      return;
    }

    if (action === "rest") {
      const expGain = getRandomInt(50, 200);
      userData.exp += expGain;
      userData.rank = determineRank(userData.exp);
      await saveMinerData(db, senderID.toString(), userData);
      const restMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines Rest",
        headerSymbol: "💤",
        headerStyle: "bold",
        bodyText: `Gained ${expGain} EXP! New Rank: ${userData.rank}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(restMessage, threadID, messageID);
      return;
    }

    if (action === "tournament") {
      const enemies = ["Iron Golem", "Cave Spider", "Zombie Miner", "Lava Slime"];
      const enemy = enemies[getRandomInt(0, enemies.length - 1)];
      const expGain = getRandomInt(500, 1000);
      userData.exp += expGain;
      userData.rank = determineRank(userData.exp);
      await saveMinerData(db, senderID.toString(), userData);
      const tournamentMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines Tournament",
        headerSymbol: "🏆",
        headerStyle: "bold",
        bodyText: `Fought ${enemy}, gained ${expGain} EXP! New Rank: ${userData.rank}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(tournamentMessage, threadID, messageID);
      return;
    }

    if (action === "shop") {
      const shopItems: { [key: string]: ShopItem } = {
        wooden_pickaxe: { cost: { silverOre: 50 }, level: 1, effect: "Basic mining tool" },
        iron_pickaxe: { cost: { silverOre: 150, goldOre: 10 }, level: 2, effect: "Increases ore yield by 2x" },
        diamond_pickaxe: { cost: { silverOre: 300, goldOre: 30, diamondOre: 5 }, level: 3, effect: "Increases ore yield by 3x" },
        diamond_ore: { cost: { silverOre: 20 }, amount: 1 },
        gold_ore: { cost: { silverOre: 10 }, amount: 1 },
      };
      const shopMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Shop",
        headerSymbol: "🛍️",
        headerStyle: "bold",
        bodyText: Object.entries(shopItems).map(([key, details]) => {
          const costStr = Object.entries(details.cost)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(", ");
          const displayText = details.effect ? `${details.effect}` : `Get ${details.amount || 0} ${key.replace("_", " ")}`;
          return `- ${key}: ${displayText} (Cost: ${costStr})`;
        }).join("\n") + "\nUse /mines buy <key> to purchase.",
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(shopMessage, threadID, messageID);
      return;
    }

    if (action === "buy") {
      const key = args[1]?.toLowerCase();
      const shopItems: { [key: string]: ShopItem } = {
        wooden_pickaxe: { cost: { silverOre: 50 }, level: 1, effect: "Basic mining tool" },
        iron_pickaxe: { cost: { silverOre: 150, goldOre: 10 }, level: 2, effect: "Increases ore yield by 2x" },
        diamond_pickaxe: { cost: { silverOre: 300, goldOre: 30, diamondOre: 5 }, level: 3, effect: "Increases ore yield by 3x" },
        diamond_ore: { cost: { silverOre: 20 }, amount: 1 },
        gold_ore: { cost: { silverOre: 10 }, amount: 1 },
      };
      if (!key || !shopItems[key]) {
        const invalidItem = AuroraBetaStyler.styleOutput({
          headerText: "Miner Shop",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Invalid key. Use /mines shop to see available keys.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(invalidItem, threadID, messageID);
        return;
      }
      const itemData = shopItems[key];
      const canAfford = userData.materials.diamondOre >= (itemData.cost.diamondOre || 0) &&
                       userData.materials.goldOre >= (itemData.cost.goldOre || 0) &&
                       userData.materials.silverOre >= (itemData.cost.silverOre || 0);
      if (!canAfford) {
        const insufficientMessage = AuroraBetaStyler.styleOutput({
          headerText: "Miner Shop",
          headerSymbol: "❌",
          headerStyle: "bold",
          bodyText: "You don't have enough resources to buy this item.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(insufficientMessage, threadID, messageID);
        return;
      }
      userData.materials.diamondOre -= itemData.cost.diamondOre || 0;
      userData.materials.goldOre -= itemData.cost.goldOre || 0;
      userData.materials.silverOre -= itemData.cost.silverOre || 0;
      if (itemData.level) {
        userData.equipment.pickaxe = key.replace("_", " ");
        userData.equipment.pickaxeLevel = itemData.level;
      } else if (itemData.amount) {
        const material = key.replace("_", " ") as keyof typeof userData.materials;
        userData.materials[material] += itemData.amount;
      }
      await saveMinerData(db, senderID.toString(), userData);
      const buyMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Shop",
        headerSymbol: "✅",
        headerStyle: "bold",
        bodyText: `Purchased ${key.replace("_", " ")}! ${itemData.effect || `You now have more ${key.replace("_", " ")}.`}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(buyMessage, threadID, messageID);
      return;
    }

    if (action === "trade") {
      const targetUID = args[1]?.toLowerCase();
      if (!targetUID) {
        const tradeHelp = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "🤝",
          headerStyle: "bold",
          bodyText: "Usage: /mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(tradeHelp, threadID, messageID);
        return;
      }

      if (args[2]?.toLowerCase() === "accept") {
        const tradeRequestsCollection = db.db("tradeRequests");
        const requestKey = `${targetUID}:${senderID.toString()}`;
        const tradeRequest = await tradeRequestsCollection.findOne({ from: targetUID, to: senderID.toString() });
        if (!tradeRequest) {
          const noRequest = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "⚠️",
            headerStyle: "bold",
            bodyText: `No trade request from ${targetUID}.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(noRequest, threadID, messageID);
          return;
        }
        const { from, offer } = tradeRequest;
        const fromData = await getMinerData(db, from);
        const toData = await getMinerData(db, senderID.toString());

        if (fromData.materials.diamondOre >= offer.diamondOre &&
            fromData.materials.goldOre >= offer.goldOre &&
            fromData.materials.silverOre >= offer.silverOre) {
          fromData.materials.diamondOre -= offer.diamondOre;
          fromData.materials.goldOre -= offer.goldOre;
          fromData.materials.silverOre -= offer.silverOre;
          toData.materials.diamondOre += offer.diamondOre;
          toData.materials.goldOre += offer.goldOre;
          toData.materials.silverOre += offer.silverOre;
          await saveMinerData(db, from, fromData);
          await saveMinerData(db, senderID.toString(), toData);
          await removeTradeRequest(db, from, senderID.toString());
          const acceptMessage = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "✅",
            headerStyle: "bold",
            bodyText: `Trade accepted with ${from}. Received ${offer.diamondOre} diamond, ${offer.goldOre} gold, ${offer.silverOre} silver ore.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(acceptMessage, threadID, messageID);
        } else {
          const insufficientMessage = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "❌",
            headerStyle: "bold",
            bodyText: `Trade failed. ${from} doesn't have enough resources.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(insufficientMessage, threadID, messageID);
        }
        return;
      }

      const diamond = parseInt(args[2]) || 0;
      const gold = parseInt(args[3]) || 0;
      const silver = parseInt(args[4]) || 0;
      if (diamond < 0 || gold < 0 || silver < 0 || !targetUID) {
        const invalidTrade = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Invalid trade offer. Use: /mines trade <uid> <diamond> <gold> <silver>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(invalidTrade, threadID, messageID);
        return;
      }

      const senderData = await getMinerData(db, senderID.toString());
      if (senderData.materials.diamondOre < diamond || senderData.materials.goldOre < gold || senderData.materials.silverOre < silver) {
        const insufficientMessage = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "❌",
          headerStyle: "bold",
          bodyText: "You don't have enough resources to trade.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(insufficientMessage, threadID, messageID);
        return;
      }

      const tradeRequestsCollection = db.db("tradeRequests");
      await tradeRequestsCollection.insertOne({ from: senderID.toString(), to: targetUID, offer: { diamondOre: diamond, goldOre: gold, silverOre: silver }, timestamp: new Date() });
      const tradeOffer = AuroraBetaStyler.styleOutput({
        headerText: "Mines Trade",
        headerSymbol: "🤝",
        headerStyle: "bold",
        bodyText: `Trade offer sent to ${targetUID}. Offering ${diamond} diamond, ${gold} gold, ${silver} silver ore. They must use /mines trade accept ${senderID} to accept.`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(tradeOffer, threadID, messageID);
      return;
    }

    if (action === "upgrade") {
      if (!userData.equipment.pickaxe || userData.equipment.pickaxe === "None") {
        const noPickaxe = AuroraBetaStyler.styleOutput({
          headerText: "Mines Upgrade",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "You need a pickaxe to upgrade! Buy one from /mines shop.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(noPickaxe, threadID, messageID);
        return;
      }
      const currentLevel = userData.equipment.pickaxeLevel;
      if (currentLevel >= 20) {
        const maxLevelMessage = AuroraBetaStyler.styleOutput({
          headerText: "Mines Upgrade",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Your pickaxe is at max level (20)!",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(maxLevelMessage, threadID, messageID);
        return;
      }
      const upgradeOptions: { [key: string]: UpgradeOption } = {
        wooden_pickaxe: { cost: { silverOre: 20 }, ability: "2x the mining and earnings", level: 1 },
        iron_pickaxe: { cost: { silverOre: 50, goldOre: 10 }, ability: "3x the mining and earnings", level: 2 },
        diamond_pickaxe: { cost: { silverOre: 100, goldOre: 30, diamondOre: 5 }, ability: "5x the mining and earnings", level: 3 },
      };

      const currentPickaxeKey = userData.equipment.pickaxe?.toLowerCase().replace(" ", "_");
      const availableUpgrades = Object.entries(upgradeOptions)
        .filter(([key, upgrade]) => {
          const isHigherTier = !currentPickaxeKey || upgradeOptions[currentPickaxeKey]?.cost.silverOre < upgrade.cost.silverOre;
          const canAfford = userData.materials.silverOre >= upgrade.cost.silverOre &&
                          (!upgrade.cost.goldOre || userData.materials.goldOre >= upgrade.cost.goldOre) &&
                          (!upgrade.cost.diamondOre || userData.materials.diamondOre >= upgrade.cost.diamondOre);
          return isHigherTier && canAfford;
        })
        .map(([key, upgrade]) => {
          const costStr = Object.entries(upgrade.cost)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(", ");
          return `- ${key.replace("_", " ")}: Cost: ${costStr}, Ability: ${upgrade.ability}`;
        });

      if (availableUpgrades.length === 0) {
        const noUpgrades = AuroraBetaStyler.styleOutput({
          headerText: "Mines Upgrade",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: `No upgrades available. Current Pickaxe: ${userData.equipment.pickaxe} (Level ${currentLevel}). Collect more resources!`,
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(noUpgrades, threadID, messageID);
        return;
      }

      const upgradePrompt = AuroraBetaStyler.styleOutput({
        headerText: "Mines Upgrade",
        headerSymbol: "🔧",
        headerStyle: "bold",
        bodyText: `Available Upgrades:\n${availableUpgrades.join("\n")}\nReply with the pickaxe name (e.g., "wooden pickaxe") to upgrade.`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });

      let sentMessageID: string;
      await new Promise((resolve, reject) => {
        api.sendMessage(upgradePrompt, threadID, (err: any, info: any) => {
          if (err) {
            console.error("Error sending upgrade prompt:", err);
            reject(err);
          } else {
            sentMessageID = info.messageID;
            resolve(info);
          }
        }, messageID);
      });
      if (!global.Kagenou.replyListeners) {
        global.Kagenou.replyListeners = new Map();
      }
      const handleReply = async (ctx: { api: any; event: any; data?: any }) => {
        const { api, event } = ctx;
        const { threadID, messageID } = event;
        const userReply = event.body?.toLowerCase().trim();
        const selectedUpgrade = Object.keys(upgradeOptions).find(key => userReply === key.replace("_", " "));

        if (!selectedUpgrade) {
          await api.sendMessage(
            AuroraBetaStyler.styleOutput({
              headerText: "Mines Upgrade",
              headerSymbol: "⚠️",
              headerStyle: "bold",
              bodyText: "Invalid pickaxe name. Please choose from the available upgrades.",
              bodyStyle: "bold",
              footerText: "Developed by: **Aljur pogoy**",
            }),
            threadID,
            messageID
          );
          return;
        }

        const upgrade = upgradeOptions[selectedUpgrade];
        if (userData.materials.silverOre < upgrade.cost.silverOre ||
            (upgrade.cost.goldOre && userData.materials.goldOre < upgrade.cost.goldOre) ||
            (upgrade.cost.diamondOre && userData.materials.diamondOre < upgrade.cost.diamondOre)) {
          await api.sendMessage(
            AuroraBetaStyler.styleOutput({
              headerText: "Mines Upgrade",
              headerSymbol: "❌",
              headerStyle: "bold",
              bodyText: "You don't have enough resources to upgrade to this pickaxe!",
              bodyStyle: "bold",
              footerText: "Developed by: **Aljur pogoy**",
            }),
            threadID,
            messageID
          );
          return;
        }

        userData.materials.silverOre -= upgrade.cost.silverOre;
        if (upgrade.cost.goldOre) userData.materials.goldOre -= upgrade.cost.goldOre;
        if (upgrade.cost.diamondOre) userData.materials.diamondOre -= upgrade.cost.diamondOre;
        userData.equipment.pickaxeLevel = upgrade.level; // Set to the new level from upgradeOptions
        userData.equipment.pickaxe = selectedUpgrade.replace("_", " ");
        await saveMinerData(db, senderID.toString(), userData);

        await api.sendMessage(
          AuroraBetaStyler.styleOutput({
            headerText: "Mines Upgrade",
            headerSymbol: "✅",
            headerStyle: "bold",
            bodyText: `Upgraded to ${userData.equipment.pickaxe} (Level ${userData.equipment.pickaxeLevel})! Earnings now multiplied by ${getCollectionMultiplier(userData.equipment.pickaxeLevel)}x.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          }),
          threadID,
          messageID
        );
      };
      global.Kagenou.replyListeners.set(sentMessageID, { callback: handleReply });
      return; 
    }

    const helpMessage = AuroraBetaStyler.styleOutput({
      headerText: "Mines Help",
      headerSymbol: "ℹ️",
      headerStyle: "bold",
      bodyText: "Usage:\n/mines register <name>\n/mines start\n/mines profile\n/mines inventory\n/mines collect\n/mines rest\n/mines tournament\n/mines shop\n/mines buy <key>\n/mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid>\n/mines upgrade",
      bodyStyle: "bold",
      footerText: "Developed by: **Aljur pogoy**",
    });
    await api.sendMessage(helpMessage, threadID, messageID);
  },
};

export default minesCommand;
