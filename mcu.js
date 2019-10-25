const express = require('express');
const app = express();
const PORT = 4000;
const cors = require('cors');
const bodyParser = require('body-parser');
const {RTCPeerConnection, RTCIceCandidate, getUserMedia} = require('wrtc')

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log('hit from client')
  res.send("sent from server!!!")
});

app.listen(PORT, () => {
  console.log("Server is running on port" + PORT);
});

const configuration = {
  iceServers: [{
      urls: [ "stun:u3.xirsys.com" ]
   }, {
      username: "i5TYHtlO_stys9vzKotBJUBndcqXQX8739HtgkBip-7RVuviaCnCqINvB0By0S_xAAAAAF2yOEVjb3VudG9sYWY=",
      credential: "c296a84a-f6b8-11e9-9ec7-86b7e87eee77",
      urls: [
          "turn:u3.xirsys.com:80?transport=udp",
          "turn:u3.xirsys.com:3478?transport=udp",
          "turn:u3.xirsys.com:80?transport=tcp",
          "turn:u3.xirsys.com:3478?transport=tcp",
          "turns:u3.xirsys.com:443?transport=tcp",
          "turns:u3.xirsys.com:5349?transport=tcp"
      ]
   }]
}

let iceCandidates = []

setUpRTCIceHandler = (RTCpeer, username, answer) => {
  RTCpeer.onicecandidate = (event) => {
    console.log("gathering ice")
    if (event.candidate) {
      iceCandidates.push(event.candidate)
    }
    if (event.candidate === null) {
        console.log("gathering complete")
        sendTo(users[username], {
          type: 'answer',
          answer: answer,
          candidates: iceCandidates,
          username: 'server'
        })
    }
  }
}

addIceCandidates = (RTCpeer, candidates) => {
  candidates.forEach(candidate => {
    RTCpeer.addIceCandidate(new RTCIceCandidate(candidate))
  })
}

const WebSocket = require('ws')

const sendTo = (ws, message, username) => {
  if (username){
    Object.keys(users).forEach(user => {
      if (user != username) {
        users[user].send(JSON.stringify(message))
      }
    })
  } else {
    ws.send(JSON.stringify(message))
  }
}

const wss = new WebSocket.Server({ port: 8080 })

let serverRTCpeer = new RTCPeerConnection(configuration)    

localStream = null

getUserMedia({audio: true,video: true})
.then( stream => {
  stream.getTracks().forEach((track)=>{
    serverRTCpeer.addTrack(track, stream)
  })
})

let broadcast = {
  set(obj, prop, stream) {
    console.log("setting", obj, prop, Object.keys(stream))
    sendTo(null, {
      type: 'new-stream',
      stream: stream
    }, '-')
    Reflect.set(obj, prop, stream)
    return true
  }
}
users = {}
streams = []
let stream_proxy = new Proxy([], broadcast)

wss.on('connection', ws => {
  console.log('User connected')

  ws.on('message', async (message) => {

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
          sendTo(null, { type: 'new-user', users: Object.keys(users) }, '-')
        } else {
          console.log("login failed, user exists")
          sendTo(ws, { type: 'login', success: false })
        }
        break
      case 'offer':
        console.log('recieved offer', data.offer)
    
        serverRTCpeer.setRemoteDescription(data.offer)
        addIceCandidates(serverRTCpeer, data.candidates)

        serverRTCpeer.ontrack = (event) => {
          stream_proxy.push(event.streams[0])
          console.log('got streams', stream_proxy)
        }

        let answer
        try {
          answer = await serverRTCpeer.createAnswer()
        } catch (error) {
          console.log("error creating answer")
          console.error(error)
        }
        console.log(answer)

        setUpRTCIceHandler(serverRTCpeer, data.username, answer)
        
        serverRTCpeer.setLocalDescription(answer)

        break
      case 'answer':
        console.log('Sending answer to: ', 'all other users')
        sendTo(users[data.answerToUsername], {
          type: 'answer',
          answer: data.answer,
          username: data.username
        })
        break
      case 'candidate':
        console.log('Sending candidate to: all other users')
        sendTo(users[data.iceToUsername], {
          type: 'candidate',
          candidate: data.candidate,
          username: data.username
        })
        break
    }

  })

  ws.on('close', () => {
    //handle closing
  })
})
