const http = require("http");
const url = require("url");
const request = require("request");

// Read from the environment variables
var slack_access_token = process.env.SLACK_TOKEN;
const slack_client_id = process.env.CLIENT_ID;
const slack_client_secret = process.env.CLIENT_SECRET;

http
  .createServer((request, response) => {
    if (request.method === "GET" && request.url.includes("/auth")) {
      // Request slack API user token via OAuth
      response.writeHead(200);
      const parsedUrl = url.parse(request.url, true);
      var slack_verification_code = parsedUrl.query.code;
      getAccessToken(slack_verification_code);
      response.end(
        "Access token received"
      );
    } else if (request.method === "POST") {
      // Send Slack API request to update user's slack status
      let body = [];
      request
        .on("data", chunk => {
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          const response_object = JSON.parse(body);
          console.log("HTTP POST received:\n", response_object);
          postToSlack(response_object);
          response.end(body);
        });
    } else {
      // any other request
      response.end("invalid request: " + request.url.toString());
    }
  })
  .listen(8080);

function getAccessToken(slack_verification_code) {
  const slack_oauth_url = "https://slack.com/api/oauth.access";
  const query = new URLSearchParams({
    client_id: slack_client_id,
    client_secret: slack_client_secret,
    code: slack_verification_code
  }).toString();

  var request_options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: query
  };
  request(slack_oauth_url, request_options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    const oauth_response = JSON.parse(body);
    slack_access_token = oauth_response.access_token;
    console.log("Access token received: ", slack_access_token);

  });
}

function postToSlack(request_body) {
  const user_token = slack_access_token;

  var status_text;
  var status_emoji;
  var status_expiration;

  var expiration = new Date();
  const time_zone_offset = 5; // 😬
  expiration.setHours(23 + time_zone_offset);
  expiration.setMinutes(59);
  expiration.setSeconds(0);
  expiration = Math.round(expiration.getTime() / 1000); // convert ms to seconds for Slack API

  switch (request_body.location) {
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
      Authorization: "Bearer " + user_token
    },
    json: true,
    body: json_payload
  };
  request(slack_api_url, request_options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(
      "updated " +
        body.profile.first_name +
        " " +
        body.profile.last_name +
        "'s status:",
      body.profile.status_emoji,
      body.profile.status_text
    );
  });
}

// curl -i -X POST -H 'Content-Type: application/json' -d '{"location": "richmond"}' https://akaoka-geoslack.glitch.me
// https://slack.com/oauth/authorize?client_id=2441242254.837585685092&scope=users.profile%3Aread+users.profile%3Awrite&redirect_url=https%3A%2F%2Fakaoka-geoslack.glitch.me%2Fauth&team=T02CZ747G
