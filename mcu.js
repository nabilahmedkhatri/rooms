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
  console.log("Server is running on port " + PORT);
});

const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })


const room = new Room()

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
users = {}
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

        if (!users[data.username] && data.username) {
          const newUser = new User(data.username)
          newUser.localWebsocket = ws
          newUser.recieveMessage('ws', {type: 'login', username: data.username, success: true})

          users[data.username] = newUser

          room.addUser(newUser)
        } else {
          ws.send(JSON.stringify({ type: 'login', success: false }))
        }
        break
      case 'offer':
        // console.log('recieved offer', data.offer, data.username, "with candidates", data.candidates)

        const user = users[data.username]
        user.createNewLocalRTCpeer(data.offer, data.candidates)


        // user.addIceCandidates(data.candidates)

        break
      case 'answer':
        console.log('got answer', data.answer, 'from', data.username, 'to', data.remoteUsername, 'containing', data.iceCandidates)
        
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

const remotews = new WebSocket.Server({ port: 9000 })

remotews.on('connection', rws => {
  console.log('remote user connected')

  rws.on('message', rmessage => {
    let data = null

    try {
      data = JSON.parse(rmessage)
    } catch (error) {
      console.error('Invalid JSON', error)
      data = {}
    }

    switch(data.type) {
      case 'offer':
        const user = users[data.username]
        
        user.remoteWebsocket = rws
        user.handleOffer(data.remoteUsername, data.offer, data.candidates)
        break
      default:
        break
    }

  })
})