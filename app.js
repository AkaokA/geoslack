const { WebClient } = require('@slack/web-api');

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

const newStatus = {
  "profile": {
    "status_text": "being a boss",
    "status_emoji": ":+1:",
    "status_expiration": 0,
  }
};

(async () => {

  const result = await web.users.profile.set(newStatus)
  
  // The result contains an identifier for the message, `ts`.
  console.log(`Successfully set status`, result);
})();