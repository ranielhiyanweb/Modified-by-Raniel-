const axios = require("axios");

const userScores = new Map();
const scoreTimeouts = new Map();

function resetUserScore(userID) {
  userScores.delete(userID);
  scoreTimeouts.delete(userID);
}

function startScoreTimer(userID) {
  if (scoreTimeouts.has(userID)) {
    clearTimeout(scoreTimeouts.get(userID));
  }
  const timeout = setTimeout(() => resetUserScore(userID), 5 * 60 * 1000);
  scoreTimeouts.set(userID, timeout);
}

module.exports = {
  config: {
    name: "quiz",
    nonPrefix: true,
    author: "Raniel",
    description: "Random quiz with choices, timer, and score tracking.",
    usage: "<prefix>quiz",
    role: 0,
    aliases: ["qz"],
  },

  async run({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const endpoint = "https://kaiz-apis.gleeze.com/api/quiz?limit=5&apikey=72f8161d-50d4-4177-a3b4-bd6891de70ef";
    let quiz;

    try {
      const res = await axios.get(endpoint);
      const results = res.data?.result;
      if (Array.isArray(results) && results.length > 0) {
        // Pick random question
        quiz = results[Math.floor(Math.random() * results.length)];
      }
      if (!quiz) throw new Error("Empty quiz list");
    } catch (err) {
      console.error("❌ Quiz fetch error:", err.message);
      return api.sendMessage("❌ Hindi makakuha ng quiz ngayon. Subukan ulit mamaya.", threadID, messageID);
    }

    const choices = quiz.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");
    const correctIndex = quiz.options.findIndex(o => o === quiz.correct_answer);
    const correctLetter = String.fromCharCode(65 + correctIndex);

    const quizMsg = `🧠 Quiz Time!
━━━━━━━━━━━━━━━
📚 Category: ${quiz.category}
🎯 Difficulty: ${quiz.difficulty}
❓ Question: ${quiz.question}
🔢 Choices:
${choices}
━━━━━━━━━━━━━━━
⌛ You have 10 seconds to answer with A, B, C, or D.`;

    api.sendMessage(quizMsg, threadID, async (err, info) => {
      if (err) return console.error(err);

      global.quizAnswer = {
        messageID: info.messageID,
        threadID,
        senderID,
        correct: correctLetter,
        correctText: quiz.correct_answer,
        answered: false
      };

      startScoreTimer(senderID);

      setTimeout(() => {
        if (global.quizAnswer && !global.quizAnswer.answered && global.quizAnswer.senderID === senderID) {
          api.sendMessage(`⏰ Time's up! Ang tamang sagot ay ${correctLetter}. ${quiz.correct_answer}`, threadID);
          global.quizAnswer = null;
        }
      }, 10000);
    });
  },

  handleReply({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (
      !global.quizAnswer ||
      global.quizAnswer.answered ||
      global.quizAnswer.senderID !== senderID
    ) return;

    const ans = body.trim().toUpperCase();
    if (!["A","B","C","D"].includes(ans)) return;

    global.quizAnswer.answered = true;
    const correct = ans === global.quizAnswer.correct;

    if (correct) {
      const prev = userScores.get(senderID) || 0;
      userScores.set(senderID, prev + 1);
    }
    const score = userScores.get(senderID) || 0;

    const msg = correct
      ? `✅ Tama! 🎉 ${global.quizAnswer.correct}. ${global.quizAnswer.correctText}\n🏆 Score: ${score}`
      : `❌ Mali. Ang tamang sagot: ${global.quizAnswer.correct}. ${global.quizAnswer.correctText}\n🏆 Score: ${score}`;

    api.sendMessage(msg, threadID, messageID);
    startScoreTimer(senderID);
    global.quizAnswer = null;
  }
};
