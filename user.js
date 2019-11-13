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
        this.RTCpeers = {}
        this.active = false
    }

    set localWebsocket(ws) {
        this.ws = ws
    }    

    set remoteWebsocket(rws) {
        this.rws = rws
    }

    get username() {
        return this.name
    }

    recieveMessage(wsType, payload) {
        if (wsType == 'ws') {
            this.ws.send(JSON.stringify(payload))
        } else {
            this.rws.send(JSON.stringify(payload))
        }
    }

    joinRoom(room) {
        this.room = room
    }

    createUserConnection(username) {
        console.log('sending new name', username)
        this.recieveMessage('ws', {
            type: 'new-connection',
            newUsername: username
        })
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
            this.RTCpeers.addIceCandidate(new RTCIceCandidate(candidate))
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

    handleOffer(newUserConnection, offer) {
        const newPeer = new RTCPeerConnection(configuration)
        this.RTCpeers[newUserConnection] = {}
        this.RTCpeers[newUserConnection]["connection"] = newPeer
        this.RTCpeers[newUserConnection]["iceCandidates"] = []

        this.addNewConnectionIceHandler(newUserConnection)

        this.RTCpeers[newUserConnection]["connection"].setRemoteDescription(offer)
        this.createNewAnswer(newUserConnection)
    }

    createNewAnswer = async (newUserConnection) => {
        let answer = null
        try {
            answer = await this.RTCpeers[newUserConnection]["connection"].createAnswer()
        } catch (err) {
            console.error("error in creating answer", err)
        }
        console.log(answer)
        this.RTCpeers[newUserConnection]["answer"] = answer

        this.RTCpeers[newUserConnection]["connection"].setLocalDescription(answer)
    }

    addNewConnectionIceHandler(newUsername) {
        this.RTCpeers[newUsername]["connection"].onicecandidate = (event) => {
            console.log('new event', event)
            if (event.candidate){
                this.RTCpeers[newUsername]["iceCandidates"].push(event.candidate)
            }

            if (event.candidate === null) {
                this.recieveMessage('rws', {
                    type: 'answer',
                    answer: this.RTCpeers[newUsername]["answer"],
                    candidates: this.RTCpeers[newUsername]["iceCandidates"],
                    username: newUsername
                })
            }
        }
    }

    addAnswer(answer) {
        this.answer = answer
        this.RTCpeers.setLocalDescription(answer)
    }

    addMediaStream(stream) {
        console.log(this.username, stream)
    }

    getRTCpeer() {
        return this.RTCpeers
    }

}

module.exports = User