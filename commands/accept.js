const path = require("path");
const moment = require("moment-timezone");

module.exports = {
  name: "autoaccept",
  description: "Automatically accepts friend requests when received.",
  author: "Aljur Pogoy | Francis Loyd Raval",
  modefier: "Raniel",
  handleEvent: true, // <-- auto runs on any incoming event
  async handleEvent({ api, event }) {
    const acceptRequest = async (uid) => {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
        doc_id: "3147613905362928",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: uid,
            client_mutation_id: Math.random().toString()
          },
          scale: 3,
          refresh_num: 0
        })
      };

      try {
        await api.httpPost("https://www.facebook.com/api/graphql/", form);
        console.log(`✅ Auto accepted friend request from UID: ${uid}`);
      } catch (e) {
        console.error(`❌ Failed to auto accept UID ${uid}: ${e.message}`);
      }
    };

    const getPendingRequests = async () => {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        const data = JSON.parse(res);
        return data.data.viewer.friending_possibilities.edges.map(e => e.node.id);
      } catch (e) {
        console.error("❌ Failed to get friend requests:", e.message);
        return [];
      }
    };

    // Only check for friend requests every few messages
    const chance = Math.random();
    if (chance < 0.05) { // 5% chance per message event (adjust as needed)
      const requests = await getPendingRequests();
      for (const uid of requests) {
        await acceptRequest(uid);
      }
    }
  }
};
