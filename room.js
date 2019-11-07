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

class Room {
    constructor() {
        console.log("created room object")
        this.users = []
        this.mediaStreams = {}
        this.RTCpeers = {}
    }

    addUser(user) {
        this.users.push(user)
    }

    createNewRTCpeer(username) {
        let RTCpeer = new RTCPeerConnection(configuration)
        this.createDummyMedia(RTCpeer)
        this.RTCpeers[username] = RTCpeer
    }

    createDummyMedia(RTCpeer) {
        getUserMedia({audio: true,video: true})
        .then( stream => {
            stream.getTracks().forEach((track)=>{
                RTCpeer.addTrack(track, stream)
            })
        })
    }

    addMediaStream(mediaStream) {

    }

}

module.exports = Room