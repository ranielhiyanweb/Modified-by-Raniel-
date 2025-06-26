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

  const timeout = setTimeout(() => {
    resetUserScore(userID);
  }, 5 * 60 * 1000); // 5 minutes

  scoreTimeouts.set(userID, timeout);
}

module.exports = {
  config: {
    name: "quiz",
    author: "Raniel",
    nonPrefix: true,
    description: "Random quiz with choices, timer, and score tracking.",
    usage: "<prefix>quiz",
    role: 0,
    aliases: ["qz"],
  },

  async run({ api, event }) {
    const { threadID, messageID, senderID } = event;

    const url = `https://kaiz-apis.gleeze.com/api/quiz?limit=1&apikey=72f8161d-50d4-4177-a3b4-bd6891de70ef`;

    try {
      const res = await axios.get(url);
      const quiz = res.data?.result?.[0];
      if (!quiz) {
        return api.sendMessage("❌ No quiz found from the API.", threadID, messageID);
      }

      const choices = quiz.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");
      const correctAnswerIndex = quiz.options.findIndex(opt => opt === quiz.correct_answer);
      const correctLetter = String.fromCharCode(65 + correctAnswerIndex); // A/B/C/D

      const quizMsg = `🧠 Quiz Time!
━━━━━━━━━━━━━━━
📚 Category: ${quiz.category}
🎯 Difficulty: ${quiz.difficulty}
❓ Question: ${quiz.question}
🔢 Choices:
${choices}
━━━━━━━━━━━━━━━
⌛ You have *10 seconds* to answer by replying with the letter (A, B, C, D).`;

      api.sendMessage(quizMsg, threadID, async (err, info) => {
        if (err) return console.error(err);

        // Save listener
        global.quizAnswer = {
          messageID: info.messageID,
          correct: correctLetter,
          correctText: quiz.correct_answer,
          answered: false,
          senderID,
          threadID,
        };

        // Start/reset user score timer
        startScoreTimer(senderID);

        // Set timeout to auto-reveal answer
        setTimeout(() => {
          if (global.quizAnswer && !global.quizAnswer.answered && global.quizAnswer.senderID === senderID) {
            api.sendMessage(
              `⏰ Time's up!\nThe correct answer is: ${correctLetter}. ${quiz.correct_answer}`,
              threadID
            );
            global.quizAnswer = null;
          }
        }, 10000); // 10 seconds
      });

    } catch (err) {
      console.error("❌ Quiz error:", err.message);
      api.sendMessage("❌ Error fetching quiz. Please try again later.", threadID, messageID);
    }
  },

  handleReply({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (!global.quizAnswer || global.quizAnswer.answered || global.quizAnswer.senderID !== senderID) return;

    const userAnswer = body.trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(userAnswer)) {
      global.quizAnswer.answered = true;

      const isCorrect = userAnswer === global.quizAnswer.correct;

      // Score tracking
      if (isCorrect) {
        const prevScore = userScores.get(senderID) || 0;
        userScores.set(senderID, prevScore + 1);
      }

      const currentScore = userScores.get(senderID) || 0;
      const replyMsg = isCorrect
        ? `✅ Correct! 🎉 The answer is ${global.quizAnswer.correct}. ${global.quizAnswer.correctText}\n🏆 Your score: ${currentScore}`
        : `❌ Wrong answer.\nThe correct answer was: ${global.quizAnswer.correct}. ${global.quizAnswer.correctText}\n🏆 Your score: ${currentScore}`;

      api.sendMessage(replyMsg, threadID, messageID);
      global.quizAnswer = null;

      startScoreTimer(senderID);
    }
  }
};
