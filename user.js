class User {
    constructor(name) {
        this.name = name
        this.id = Math.random()
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

}

module.exports = User