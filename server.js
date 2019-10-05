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
  // console.log('ws', ws)
  ws.send(JSON.stringify(message))
}

users = {}
room = []

wss.on('connection', ws => {
  console.log('User connected')
  // console.log(ws)

  ws.on('message', message => {
    // console.log(`Received message => ${message}`)

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
        if (users[data.username]) {
          sendTo(ws, { type: 'login', success: false })
        } else {
          users[data.username] = ws
          console.log('login u ', data.username )
          ws.username = data.username
          sendTo(ws, { type: 'login', success: true })
          room.push(data.username)
        }
        break

      case 'offer':
        ws.otherUsername = data.otherUsername
        ws.room = room
        Object.values(users).forEach( (user) => {
          if (user.username != data.username)
            console.log("sending an offer to ", user.username)
            sendTo(user, {
              type: 'offer',
              offer: data.offer,
              username: ws.username
            })
        })
        break
      case 'answer':
        Object.values(users).forEach(user =>{
          if (user.username != data.username) {
            console.log('Sending answer to: ', user.username)
            console.log("in answer data username", data.username)
            sendTo(user, {
            type: 'answer',
            answer: data.answer
            })
          }
        })
        break
      case 'candidate':
        Object.values(users).forEach(user =>{
          if (user.username != data.username) {
            console.log('Sending candidate to:', user.username)
            sendTo(user, {
            type: 'candidate',
            candidate: data.candidate
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
