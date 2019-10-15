import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap'

const ws = new WebSocket('ws://localhost:8080')

const configuration = {
    iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
}

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
        this.sendMessage({ type: 'login', username: this.state.username })
    }

    sendMessage = message => {
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
                case 'offer':
                    this.handleOffer(data.offer, data.username)
                    break
                case 'answer':
                    this.handleAnswer(data.answer)
                    break
                case 'candidate':
                    this.handleCandidate(data.candidate)
                    break
                default:
                    break
            }
        }
    }

    handeLogin = (loginUsername, success) => {
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

        localRTCpeer.ontrack = (event) => {
            this.videoTagRemote.current.srcObject = event.streams[0]
        }

        localRTCpeer.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'candidate',
                    candidate: event.candidate,
                    username: this.state.username
                })
            }
        }

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

        this.setState({
            localRTC: localRTCPeer
        })
    }

    handleOffer = async (offer, username) => {
        let newRTCpeer = this.state.localRTC

        newRTCpeer.setRemoteDescription(offer)

        let answer = null
        try {
            answer = await newRTCpeer.createAnswer()
        } catch (error) {
            console.log("error creating answer")
            console.error(error)
        }

        newRTCpeer.setLocalDescription(answer)

        this.setState({
            localRTC: newRTCpeer
        })

        this.sendMessage({
            type: 'answer',
            answer: answer,
            username: this.state.username
        })
    }

    handleAnswer = answer => {
        let localRTCPeer = this.state.localRTC

        localRTCPeer.setRemoteDescription(new RTCSessionDescription(answer))

        this.setState({
            localRTC: localRTCPeer
        })
    }

    handleCandidate = candidate => {
        let localRTCPeer = this.state.localRTC

        localRTCPeer.addIceCandidate(new RTCIceCandidate(candidate))

        this.setState({
            localRTC: localRTCPeer
        })
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