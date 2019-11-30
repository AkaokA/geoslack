const request = require("request");
const express = require('express')

// Read from the environment variables
var slack_access_token = process.env.SLACK_TOKEN;
const slack_client_id = process.env.CLIENT_ID;
const slack_client_secret = process.env.CLIENT_SECRET;


const app = express();
const port = 3000;

app.use(express.json());

/* 
============================
Routes                       
============================
*/

app.get('/auth', (req, res) => {
  var path = new URL('https://slack.com/oauth/authorize')
  path.search = auth_query
  res.redirect(path)
})

const auth_query = `client_id=${slack_client_id}&redirect_uri=${redirect}&scope=users.profile:write`
app.get('/process_auth', (req, res) => {
  getAccessToken(req.query.code, (err, tokenRes, body) => {
    if (err) {
      res.send(`Error: ${err}`)
    } else {
      const auth_response = JSON.parse(body)
      const code = auth_response.access_token
      res.send(`<h1>Copy this code and use it in your shortcut</h1><p>${code}</p>`)
    }
  })
})

app.post('/status', (req, res) => {
  const {token, location} = req.body
  postToSlack(token, location, (error, slackResponse, body) => {
    if (error) {
      console.log(error)
      res.json(error)
    } else {
      res.json(body)    
    }
  })
})

app.listen(port, ()=> console.log('awake...'));


/* 
============================
Slack API Wrapper                       
============================
*/

function getAccessToken(slack_verification_code, callback) {
  const slack_oauth_url = "https://slack.com/api/oauth.access";
  const query = new URLSearchParams({
    client_id: slack_client_id,
    client_secret: slack_client_secret,
    code: slack_verification_code,
    redirect_uri: redirect
  }).toString();

  var request_options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: query
  };
  request(slack_oauth_url, request_options, callback)
}

function postToSlack(token, location, callback) {
  var status_text;
  var status_emoji;
  var status_expiration;

  var expiration = new Date();
  const time_zone_offset = 5; // 😬
  expiration.setHours(23 + time_zone_offset);
  expiration.setMinutes(59);
  expiration.setSeconds(0);
  expiration = Math.round(expiration.getTime() / 1000); // convert ms to seconds for Slack API

  switch (location) {
    case "richmond":
      status_text = "Richmond office";
      status_emoji = ":rtrain:";
      status_expiration = expiration;
      break;
    case "spadina":
      status_text = "Spadina office";
      status_emoji = ":strain:";
      status_expiration = expiration;
      break;
    case "nyc":
      status_text = "Brooklyn office";
      status_emoji = ":statue_of_liberty:";
      status_expiration = 0;
      break;
    case "remote":
      status_text = "Working remotely";
      status_emoji = ":house:";
      status_expiration = expiration;
      break;
    default:
      status_text = "";
      status_emoji = "";
  }

  var json_payload = {
    profile: {
      status_text: status_text,
      status_emoji: status_emoji,
      status_expiration: status_expiration
    }
  };

  const slack_api_url = "https://slack.com/api/users.profile.set";
  var request_options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    headers: {
      Authorization: "Bearer " + token
    },
    json: true,
    body: json_payload
  };
  request(slack_api_url, request_options, callback)
}

// curl -i -X POST -H 'Content-Type: application/json' -d '{"location": "richmond"}' https://akaoka-geoslack.glitch.me
// https://slack.com/oauth/authorize?client_id=2441242254.837585685092&scope=users.profile%3Aread+users.profile%3Awrite&redirect_url=https%3A%2F%2Fakaoka-geoslack.glitch.me%2Fauth&team=T02CZ747G
