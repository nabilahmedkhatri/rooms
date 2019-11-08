const {RTCPeerConnection, RTCIceCandidate, getUserMedia} = require('wrtc')

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

class User {
    constructor(name) {
        this.name = name
        this.id = Math.random()
        this.iceCandidates = []
        this.room = null
    }

    set websocket(ws) {
        this.ws = ws
    }    

    get username() {
        return this.name
    }

    recieveMessage(payload) {
        this.ws.send(JSON.stringify(payload))
    }

    joinRoom(room) {
        this.room = room
    }

    createNewRTCpeer() {
        let RTCpeer = new RTCPeerConnection(configuration)
        this.createDummyMedia()
        this.RTCpeer = RTCpeer
    }

    createDummyMedia() {
        getUserMedia({audio: true,video: true})
        .then( stream => {
            stream.getTracks().forEach((track)=>{
                this.RTCpeer.addTrack(track, stream)
            })
        })
    }

    setUpRTCpeerEventHandlers() {
        this.setUpIceHandler()
        this.setUpTrackHandler()
    }

    setUpIceHandler() {
        this.RTCpeer.onicecandidate = (event) => {
            if (event.candidate) {
                this.iceCandidates.push(event.candidate)
            }
            if (event.candidate === null) {
                this.recieveMessage({
                    type: 'answer',
                    answer: this.answer,
                    candidates: this.iceCandidates,
                    username: this.username
                })
            }
        }
    }

    addIceCandidates(candidates) {
        candidates.forEach(candidate => {
            this.RTCpeer.addIceCandidate(new RTCIceCandidate(candidate))
          })
    }

    setUpTrackHandler() {
        this.RTCpeer.ontrack = (event) => {
            this.mediaStream = event.streams[0]
            this.room.newMediaStreamAdded(this.username)
        }
    }

    addAnswer(answer) {
        this.answer = answer
        this.RTCpeer.setLocalDescription(answer)
    }

    addMediaStream(stream) {
        console.log(this.username, stream)
    }

    getRTCpeer() {
        return this.RTCpeer
    }

}

module.exports = User