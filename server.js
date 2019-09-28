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

wss.on('connection', ws => {
  console.log('User connected')

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
        break
    }

  })

  ws.on('close', () => {
    //handle closing
  })
})
