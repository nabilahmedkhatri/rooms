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

wss.on('connection', ws => {
  console.log('User connected')
  // console.log(ws)

  ws.on('message', message => {
    console.log(`Received message => ${message}`)

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
          ws.username = data.username
          sendTo(ws, { type: 'login', success: true })
        }
        break

      case 'offer':
        console.log('Sending offer to: ', data.otherUsername)
        ws.otherUsername = data.otherUsername
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername
          sendTo(users[data.otherUsername], {
            type: 'offer',
            offer: data.offer,
            username: ws.username
          })
        }
        break
      case 'answer':
        console.log('Sending answer to: ', data.otherUsername)
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername
          sendTo(users[data.otherUsername], {
            type: 'answer',
            answer: data.answer
          })
        }
        break
      case 'candidate':
        console.log('Sending candidate to:', data.otherUsername)

        if (users[data.otherUsername] != null) {
          sendTo(users[data.otherUsername], {
            type: 'candidate',
            candidate: data.candidate
          })
        }
        break
    }

  })

  ws.on('close', () => {
    //handle closing
  })
})
