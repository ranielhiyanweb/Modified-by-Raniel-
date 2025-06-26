const axios = require('axios');

module.exports = {
  config: {
    name: "quiz",
    nonPrefix: true,
    author: "Aljur Pogoy",
    description: "Get a random quiz question",
    role: 0,
    usage: "<prefix>quiz",
    aliases: ["qz"],
  },

  async run({ api, event }) {
    const { threadID } = event;

    try {
      const response = await axios.get('https://kaiz-apis.gleeze.com/api/quiz?limit=1&apikey=72f8161d-50d4-4177-a3b4-bd6891de70ef');

      if (!response.data || !response.data.result || response.data.result.length === 0) {
        return api.sendMessage("❌ Walang nakuha na quiz question.", threadID);
      }

      const quiz = response.data.result[0];

      const message = `📚 *Random Quiz*\n\n❓ Question: ${quiz.question}\n\n🅰 A: ${quiz.a}\n🅱 B: ${quiz.b}\n🇨 C: ${quiz.c}\n🇩 D: ${quiz.d}\n\n💭 Sagot?`;

      await api.sendMessage(message, threadID);
    } catch (error) {
      console.error("❌ Error sa pagkuha ng quiz:", error);
      await api.sendMessage("⚠️ Nagkaroon ng error sa pagkuha ng quiz question.", threadID);
    }
  },
};
