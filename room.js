class Room {
    constructor() {
        console.log("created room object")
        this.users = {}
        this.mediaStreams = {}
        this.RTCpeers = {}
    }

    addUser(user) {
        // this.createNewPeerConnections(user.username)
        this.initiateNewUserConnection(user.username)
        this.users[user.username] = user
        user.joinRoom(this)
    }

    newMediaStreamAdded(username) {
        const user = this.users[username]
        this.relayMediaStreams(username)
    }

    createNewPeerConnections(username) {
        Object.keys(this.users).forEach(user => {
            this.users[user].createNewRemotePeer(username)
        })
    }

    initiateNewUserConnection(username) {
        Object.keys(this.users).forEach(user => {
            this.users[user].createUserConnection(username)
        })
    }

    relayMediaStreams(username) {
        console.log(username)
    }

}

module.exports = Room