const express = require('express');
const app = express();
const PORT = 4000;
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log("Request received")
  res.send({
    text: "Rooms"
  });
});

app.listen(PORT, () => {
  console.log("Server is running on port" + PORT);
});

// websocket stuff
const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })

const sendTo = (ws, message) => {
  ws.send(JSON.stringify(message))
}

users = {}
room = []

wss.on('connection', ws => {
  console.log('User connected')

  ws.on('message', message => {

    let data = null

    try {
      data = JSON.parse(message)
    } catch (error) {
      console.error('Invalid JSON', error)
      data = {}
    }

    switch (data.type) {
      case 'login':
        console.log('User logged', data.username)

        if (!users[data.username]) {
          users[data.username] = ws
          ws.username = data.username
          sendTo(ws, { type: 'login', username: data.username, success: true })
        } else {
          console.log("login failed, user exists")
          sendTo(ws, { type: 'login', success: false })
        }
        break
      case 'offer':
        console.log('Sending offer to: ', "all other users")

        Object.keys(users).forEach(user => {
          if (user != data.username) {
            sendTo(users[user], {
              type: 'offer',
              offer: data.offer,
              username: data.username
            })
          }
        })
        break
      case 'answer':
        console.log('Sending answer to: ', 'all other users')
        Object.keys(users).forEach(user => {
          if (user != data.username) {
            sendTo(users[user], {
              type: 'answer',
              answer: data.answer,
              username: data.username
            })
          }
        })
        break
      case 'candidate':
        console.log('Sending candidate to: all other users')
        Object.keys(users).forEach(user => {
          if (user != data.username) {
            sendTo(users[user], {
              type: 'candidate',
              candidate: data.candidate,
              username: data.username
            })
          }
        })
        break
    }

  })

  ws.on('close', () => {
    //handle closing
  })
})
