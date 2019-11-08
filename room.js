class Room {
    constructor() {
        console.log("created room object")
        this.users = {}
        this.mediaStreams = {}
        this.RTCpeers = {}
    }

    addUser(user) {
        this.users[user.username] = user
        user.joinRoom(this)
    }

    newMediaStreamAdded(username) {
        const user = this.users[username]
        this.createNewPeerConnections()
        this.relayMediaStreams()
    }

}

module.exports = Room