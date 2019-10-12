import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'
import {Form, FormControl } from 'react-bootstrap'

const ws = new WebSocket('ws://localhost:8080')

const configuration = {
    iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
}

var connection = new RTCPeerConnection(configuration)
var otherUserName = "self"

let username, connections, stream

class VideoBox extends React.Component {
    constructor(props) {
        super(props)
        this.videoTagLocal = React.createRef()
        this.videoTagRemote = React.createRef()
        this.videoTagRemote2 = React.createRef()
        this.state = {
            username: "",
            other_username: "",
            localRTC: null
        }

    }

    change = (e) => {
        this.setState( {
            [e.target.name]: e.target.value
        })
    }

    login = () => {
        console.log(this.state.username)
        this.sendMessage({ type: 'login', username: this.state.username })  
    }

    sendMessage = message => {
        // message.otherUserName = otherUserName

        ws.send(JSON.stringify(message))
    }

    componentDidMount() {
        ws.onopen = () => {
            console.log('Connected to the signaling server')
        }

        ws.onerror = err => {
            console.error(err)
        }

        ws.onmessage = msg => {
            console.log('Got message', msg.data)

            const data = JSON.parse(msg.data)

            switch (data.type) {
                case 'login':
                    this.handeLogin(data.username, data.success)
                    break
                // case '
                case 'video-connect':
                    this.handleVideo(data.success)
                    break
                case 'offer':
                    this.handleOffer(data.offer, data.username)
                    break
                case 'answer':
                    this.handleAnswer(data.answer)
                    break
                case 'candidate':
                    this.handleCandidate(data.candidate)
                    break
            }
        }
    }

    handeLogin = (success, loginUsername) => {
        if (!success) {
            console.log("login failed")
        }

        this.setState({
            username: loginUsername
        })
    }

    initConnection = async (e) => {
        e.preventDefault();

        let stream = null

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            })
        } catch (error) {
            console.log("error getting user media")
            console.error(error)
        }


        this.videoTagLocal.current.srcObject = stream

        let localRTCpeer = new RTCPeerConnection(configuration)

        stream.getTracks().forEach((track)=>{
            localRTCpeer.addTrack(track, stream)
        })

        this.setState({
            localRTC: localRTCpeer
        })
    }

    connectToAll = async () => {
        let localRTCPeer = this.state.localRTC

        let offer = null

        try {
            offer = await localRTCPeer.createOffer()
        } catch (error) {
            console.log("error creating offer")
            console.error(error)
        }

        this.sendMessage({
            type: "offer",
            offer: offer,
            username: this.state.username
        })

        localRTCPeer.setLocalDescription(offer)
    }

    handleOffer = (offer, username) => {
        var otherUsername = username
        console.log('handling offer ' + offer)
        connection.setRemoteDescription(new RTCSessionDescription(offer))
        console.log("this is the offer", offer)
        connection.createAnswer(
            answer => {
                connections[username].setLocalDescription(answer)
                this.sendMessage({
                    type: 'answer',
                    answer: answer
                })
            },
            error => {
                alert('Error when creating an answer')
                console.error(error)
            }
        )
    }

    handleVideo = async (success) => {
        if (!success) {
            console.error("no good")
        }
       
        this.videoTagLocal.current.srcObject = stream;

        connection.addStream(stream)

        connections[username].addStream(stream)

        connections[username].onaddstream = event => {
            if (this.state.connection_count == 0 || this.state.connection_count == 1) {
                this.videoTagRemote.current.srcObject = event.stream;
            }
            else if (this.state.connection_count == 2) {
                this.videoTagRemote2.current.srcObject = event.stream;
            }
        }

        connections[username].onicecandidate = event => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'candidate',
                    candidate: event.candidate
                })
            }
        }

        this.setState({connections})

    }

    handleAnswer = answer => {
        var connections = {...this.state.connections}

        connections[username].setRemoteDescription(new RTCSessionDescription(answer))
        this.setState({connections})
    }

    handleCandidate = candidate => {
        var connections = {...this.state.connections}

        connections[username].addIceCandidate(new RTCIceCandidate(candidate))
        this.setState({connections})
    }

    videoError = (err) => {
        alert(err)
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col>
                        <video style={{ width: "100%" }} ref={this.videoTagLocal} autoPlay></video>
                        <Form.Control onChange={this.change} name='username' type="text" placeholder="Your username" />
                        <Button onClick={this.login} variant="outline-primary">Login</Button>
                        <Form.Control onChange={this.change} name='other_username' type="text" placeholder="Connect to" />
                        <Button onClick={this.initConnection} variant="outline-primary">Init Connection</Button>
                        <Button onClick={this.connectToAll} variant="outline-primary">Connect All</Button>
                    </Col>
                    <Col>
                        <video style={{ width: "100%" }} ref={this.videoTagRemote} autoPlay></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default VideoBox;