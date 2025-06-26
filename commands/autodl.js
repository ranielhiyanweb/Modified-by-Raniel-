/*const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
module.exports = {
  name: "autodl",
  nonPrefix: true,
  handleEvent: true,
  async handleEvent({ api, event }) {
    const { threadID, messageID, body } = event;
    const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com)\/[^\s]+)/i;
    const match = body ? body.match(urlRegex) : null;
    if (!match) return;
    try {
      const encodedUrl = encodeURIComponent(match[0]);
      const apiUrl = `https://haji-mix.up.railway.app/api/autodl?url=${encodedUrl}&stream=true&api_key=21b2b7f078ab98cb5af9a0bd4eaa24c4e1c3ec20b1c864006a6f03cf0eee6006`;
      const videoResponse = await axios({
        url: apiUrl,
        method: "GET",
        responseType: "stream",
      });
      const tempVideoPath = path.join(__dirname, "../temp/ba_video.mp4");
      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      let baMessage = `════『 AUTODL 』════\n\n`;
      baMessage += `✨ Here's your video! ✨\n\n`;
      const videoStream = fs.createReadStream(tempVideoPath);
      await api.sendMessage(
        {
          body: baMessage,
          attachment: videoStream,
        },
        threadID,
        messageID
      );
      fs.unlinkSync(tempVideoPath);
    } catch (error) {
      console.error("❌ Error in autodl event:", error.message);
      let errorMessage = `════『 AUTODL 』════\n\n`;
      errorMessage += `  ┏━━━━━━━┓\n`;
      errorMessage += `  ┃ 『 𝗜𝗡𝗙𝗢 』 An error occurred while fetching the video.\n`;
      errorMessage += `  ┃ ${error.message}\n`;
      errorMessage += `  ┗━━━━━━━┛\n\n`;
      errorMessage += `> Thank you for using Raniela's Bot`;
      api.sendMessage(errorMessage, threadID, messageID);
    }
  },
};
*/

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const apiKeys = [
  '1d38b94112mshfe8d29735f4a021p129bb7jsnf4b04a33cff1',
  '5f7caa0678mshab93857a2d6c468p1fdec6jsn0487f4fa0b5e',
  '268a47d07bmsh9a8adbfc3891882p17f393jsn841d036a2984',
  'fd818d8dc9msh4455008c967d00dp1b3d8cjsnaaa64606fffb',
  '28077613bemshd5a2d7ee4aea83ep17d768jsn7e4822c17d3c',
  '505643faa8msh79e5d96fd972e86p17158fjsne8cf07a99b1f',
  'a0d7261582msh1e46378a745f8bfp19e4cfjsn997ba49602c9',
  '261d337575msh5664685b3671b8ap1d294cjsn681c6ef11cb7',
  '70635f33a6msh5bf0b759a7011f4p1a3f35jsn43237c788352'
];

const getRandomKey = () => apiKeys[Math.floor(Math.random() * apiKeys.length)];

module.exports = {
  name: "autodl",
  nonPrefix: true,
  handleEvent: true,

  async handleEvent({ api, event }) {
    const { threadID, messageID, body } = event;

    // Regex to detect supported platforms
    const urlRegex = /(https?:\/\/(?:www\.)?(?:snapchat\.com|facebook\.com|fb\.watch|tiktok\.com|instagram\.com|instagr\.am|youtube\.com|youtu\.be)\/[^\s]+)/i;
    const match = body ? body.match(urlRegex) : null;
    if (!match) return;

    const url = match[0];

    let response;
    let attempts = 0;
    const triedKeys = new Set();

    while (attempts < apiKeys.length) {
      const apiKey = getRandomKey();
      if (triedKeys.has(apiKey)) continue;
      triedKeys.add(apiKey);

      const options = {
        method: 'POST',
        url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: { url }
      };

      try {
        response = await axios.request(options);
        if (response.data.medias) break;
      } catch (error) {
        console.warn(`🔁 Failed with API key ${apiKey}: ${error.message}`);
      }
      attempts++;
    }

    if (!response || !response.data.medias) {
      return api.sendMessage("❌ Error: Unable to fetch video from the provided link.", threadID, messageID);
    }

    const media = response.data.medias.find(media => media.type === 'video' && media.quality === 'HD') || response.data.medias[0];
    if (!media) {
      return api.sendMessage("⚠️ No downloadable video found in the link.", threadID, messageID);
    }

    const videoUrl = media.url;

    try {
      const videoResponse = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
      });

      const tempVideoPath = path.join(__dirname, "../temp/autodl_video.mp4");
      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const videoStream = fs.createReadStream(tempVideoPath);
      await api.sendMessage({
        body: `🎬 Downloaded from: ${url}`,
        attachment: videoStream,
      }, threadID, messageID);

      fs.unlinkSync(tempVideoPath);
    } catch (error) {
      console.error("❌ Download error:", error.message);
      api.sendMessage("❌ Error downloading video.", threadID, messageID);
    }
  },
};
