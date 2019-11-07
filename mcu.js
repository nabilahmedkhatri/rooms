const express = require('express');
const app = express();
const PORT = 4000;
const cors = require('cors');
const bodyParser = require('body-parser');
const {RTCPeerConnection, RTCIceCandidate, getUserMedia} = require('wrtc')
const Room = require('./room')
const User = require('./user')

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log('sp', stream_proxy)
  res.send(stream_proxy[0])
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
    if (event.candidate) {
      iceCandidates.push(event.candidate)
    }
    if (event.candidate === null) {
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

const sendTo = (ws, message, username, media) => {
  if (username){
    Object.keys(users).forEach(user => {
      if (user != username) {
        if (media){
          console.log("stringify", JSON.stringify(message))
          users[user].send(message)
        } else {
          users[user].send(JSON.stringify(message))
        }
      }
    })
  } else {
    ws.send(JSON.stringify(message))
  }
}

const room = new Room()

const wss = new WebSocket.Server({ port: 8080 })

localStream = null


called = 0
let broadcast = {
  async set(obj, prop, stream) {
    array_stream = [stream]
    console.log('broadcast stream is', stream)
    if(typeof(stream) == 'object'){ 
        console.log("new track is", stream.getTracks())
        let senders = null
        try {
          senders = await serverRTCpeer.getSenders().find(s => {
            return s.track.kind == stream.getTracks()[0].kind
          })
        } catch (error) {
          console.log('sender error', error)
        }
        senders.replaceTrack(stream.getTracks()[0])
        
        // serverRTCpeer.close()
        // serverRTCpeer.onicecandidate = null
        // serverRTCpeer.ontrack = null
    }
    return Reflect.set(obj, prop, stream)
  }
}
users = new Set()
streams = []
let stream_proxy = new Proxy(streams, broadcast)

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

        if (!users.has(data.username) && data.username) {
          const newUser = new User(data.username)
          newUser.websocket = ws
          newUser.recieveMessage({type: 'login', success: true})

          users.add(data.username)

          room.addUser(newUser)
          room.createNewRTCpeer(newUser.username)
        } else {
          ws.send(JSON.stringify({ type: 'login', success: false }))
        }
        break
      case 'offer':
        console.log('recieved offer', data.offer)
    
        serverRTCpeer.setRemoteDescription(data.offer)
        addIceCandidates(serverRTCpeer, data.candidates)

        serverRTCpeer.ontrack = (event) => {
          room.addMediaStream(event.streams[0])
          // stream_proxy.push(event.streams[0])
          
          // console.log(Object.keys(event.streams[0]))
          // console.log('got streams', stream_proxy)
          // console.log(JSON.stringify(event.streams[0], null, 4))

        }

        serverRTCpeer.onnegotiationneeded = async (event) => {
          console.log(event)
          let offer = null
          try {
              offer = await serverRTCpeer.createOffer()
          } catch (error) {
              console.log("error creating offer")
              console.error(error)
          }  

          serverRTCpeer.setLocalDescription(offer)

        }

        let answer
        try {
          answer = await serverRTCpeer.createAnswer()
        } catch (error) {
          console.log("error creating answer")
          console.error(error)
        }
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
