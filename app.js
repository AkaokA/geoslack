const { WebClient } = require('@slack/web-api');
const http = require('http');
const request = require('request');

// Read a token from the environment variables
const slackToken = process.env.SLACK_TOKEN;

var response_object;

http.createServer((request, response) => {
  if (request.method === 'POST') {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      response_object = JSON.parse(body);
      console.log(response_object);
      postToSlack();
      response.end(body);
    });
  } else {
    response.end("not a post");
  }
}).listen(8080);

function postToSlack() {
  var status_text;
  var status_emoji;
  
  switch(response_object.location) {
    case "richmond":
      status_text = "Currently at Richmond";
      status_emoji = ":office:";
      break;
    case "spadina":
      status_text = "Currently at Spadina";
      status_emoji = ":office:";
      break;
    default:
      status_text = "";
      status_emoji = "";
  }
  
  var json_payload = {
    "profile": {
      "status_text": status_text,
      "status_emoji": status_emoji,
      "status_expiration": 0,
    }
  };

  const slack_api_url = "https://slack.com/api/users.profile.set";
  var request_options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    headers: {
      "Authorization": "Bearer " + slackToken
    },
    json: true,
    body: json_payload,
  };
  request(slack_api_url, request_options, (err, res, body) => {
  if (err) { return console.log(err); }
  // console.log(body);
});
}

// curl -i -X POST -H 'Content-Type: application/json' -d '{"location": "richmond"}' http://localhost:8080