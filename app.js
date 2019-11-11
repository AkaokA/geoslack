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
  var reported_location;

  switch(response_object.location) {
    case "richmond":
      reported_location = "Richmond"
      break;
    case "spadina":
      reported_location = "Spadina"
      break;
    default:
  }

  var json_data = {
    "profile": {
      "status_text": "Currently at " + reported_location,
      "status_emoji": ":office:",
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
    body: json_data,
  };
  request(slack_api_url, request_options, (err, res, body) => {
  if (err) { return console.log(err); }
  // console.log(body);
});
}

// curl -i -X POST -H 'Content-Type: application/json' -d '{"location": "richmond"}' http://localhost:8080