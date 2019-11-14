class Room {
    constructor() {
        console.log("created room object")
        this.users = {}
        this.mediaStreams = {}
        this.RTCpeers = {}
    }

    addUser(user) {
        this.initiateNewUserConnection(user.username)
        this.users[user.username] = user
        user.joinRoom(this)
    }

    newMediaStreamAdded(username, newMediaStream) {
        const user = this.users[username]
        this.relayMediaStreams(username, newMediaStream)
        this.mediaStreams[username] = newMediaStream
    }

    initiateNewUserConnection(username) {
        Object.keys(this.users).forEach(user => {
            this.users[user].createUserConnection(username)
        })
    }

    relayMediaStreams(username, newMediaStream) {
        Object.keys(this.mediaStreams).forEach(user => {
            this.users[user].addNewMediaStream(username, newMediaStream)
        })
    }

}

module.exports = Room