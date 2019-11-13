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
        this.localIceCandidates = []
        this.room = null
        this.remotePeers = {}
        this.active = false
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
        let localRTCpeer = new RTCPeerConnection(configuration)
        this.createDummyMedia(localRTCpeer)
        this.RTCpeer = localRTCpeer
    }

    createNewRemotePeer(username) {
        console.log('creating remote peer for ', username, 'in', this.username)
        let remoteRTCpeer = new RTCPeerConnection(configuration)
        this.createDummyMedia(remoteRTCpeer)
        this.remotePeers[username] = {}
        this.remotePeers[username]["connection"] = remoteRTCpeer

        this.setUpRTCpeerEventHandlers(remoteRTCpeer, username)
        this.connectRemotePeer(username)
    }

    createDummyMedia(peer) {
        getUserMedia({audio: true,video: true})
        .then( stream => {
            stream.getTracks().forEach((track)=>{
                peer.addTrack(track, stream)
            })
        })
    }

    async connectRemotePeer(username) {
        const remotePeer = this.remotePeers[username]
        let offer = null
        try {
            offer = await remotePeer["connection"].createOffer()
        } catch (err) {
            console.error("error in offer", err)
        }
        remotePeer["offer"] = offer
        remotePeer["connection"].setLocalDescription(offer)
        this.recieveMessage({
            type: 'offer',
            offer: remotePeer["offer"],
            candidates: remotePeer["iceCandidates"],
            username: username
        })
        console.log("after ", remotePeer["connection"])

    }

    setUpRTCpeerEventHandlers(peer, username) {
        if (username == 'local') {
            console.log('local')
            this.setUpLocalIceCandidate(peer)
        } else {
            this.setUpRemoteIceCandidate(peer, username)
        }
        // this.setUpIceHandler(peer, username)
        this.setUpTrackHandler(peer, username)
    }

    setUpRemoteIceCandidate(peer, remoteUsername) {
        console.log("setting up remote")
        peer.onicecandidate = (event) => {
            console.log("gather remotely for ", remoteUsername)
            if (event.candidate) {
                this.remotePeers[remoteUsername]["iceCandidates"].push(event.candidate)
            }
            if (event.candidate === null) {
                this.recieveMessage({
                    type: 'offer',
                    offer: this.remotePeers[remoteUsername]["offer"],
                    candidates: this.remotePeers[remoteUsername]["iceCandidates"],
                    username: username
                })
            }
        }
    }


    setUpLocalIceCandidate(peer) {
        peer.onicecandidate = (event) => {
            if (event.candiate) {
                this.localIceCandidates.push(event.candidate)
            }
            if (event.candidate === null) {
                this.recieveMessage({
                    type: 'answer',
                    answer: this.answer,
                    candidates: this.localIceCandidates,
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

    setUpTrackHandler(peer, username) {
        peer.ontrack = (event) => {
            if (!username) {
                this.mediaStream = event.streams[0]
                this.active = true
                this.room.newMediaStreamAdded(this.username)
            }
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