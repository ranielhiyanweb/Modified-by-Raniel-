module.exports = {

  name: "leave",
  nonPrefix: false,

  handleEvent: true,

  async handleEvent({ api, event }) {

    if (event.logMessageType === "log:unsubscribe") {

      const threadID = event.threadID;

      const removedUser = event.logMessageData.leftParticipantFbId;

      const name = event.logMessageData.leftParticipantName;

      const farewellMessage = `Adios!, ${name}! Thanks for being part of the group!\nBati mog nawong.`;

      api.sendMessage(farewellMessage, threadID);

    }

  }

};