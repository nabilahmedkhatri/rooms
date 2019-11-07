import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import axios from 'axios'
import Stream from './Stream'
import shortid  from 'shortid'

const ws = new WebSocket('ws://localhost:8080')
// ws.binaryType = "arraybuffer"
const Port = "http://localhost:4000"

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

class VideoBox extends React.Component {
    constructor(props) {
        super(props)
        this.videoTagLocal = React.createRef()
        this.videoTagRemote = React.createRef()
        this.videoTagRemote2 = React.createRef()
        this.state = {
            username: "",
            otherUsers: [],
            localRTC: null,
            localOffer: null,
            newRTC: null,
            stream: null,
            iceCandidates: [],
            peers: {},
            streams: []
        }

    }

    setUpRTCPeerMedia = (RTCpeer) => {
        let stream = this.state.stream

        stream.getTracks().forEach((track)=>{
            RTCpeer.addTrack(track, stream)
        })

        RTCpeer.ontrack = (event) => {
            console.log('recieved track', event.streams[0])
            this.setState({ streams: [...this.state.streams, {
                'media': event.streams[0],
                'id':  shortid.generate()}]})
        }
    }

    setUpRTCIceHandler = (RTCpeer, username) => {
        RTCpeer.onicecandidate = (event) => {
            if (event.candidate) {
                this.setState({
                    iceCandidates: [...this.state.iceCandidates, event.candidate]
                })
            }
            if (event.candidate === null) {
                console.log('gathering')
                this.sendMessage({
                    type: 'offer',
                    offer: this.state.localOffer,
                    username: this.state.username,
                    candidates: this.state.iceCandidates
                })
            }
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

    getStreams = () => {
        axios.get('http://localhost:4000')
        .then(res =>{
            console.log('got res', res)
        })
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

        ws.onmessage = async msg => {
            console.log('Got message', msg.data)
            // var text = await (new Response(msg.data)).text();
            // console.log('blob is', text)
            const data = JSON.parse(msg.data)

            switch (data.type) {
                case 'login':
                    this.handeLogin(data.username, data.success)
                    break
                case 'new-user':
                    this.handleNewUser(data.users)
                    break
                case 'new-stream':
                    this.handleNewStream(data.stream)
                    break
                case 'offer':
                    this.handleOffer(data.offer, data.username)
                    break
                case 'answer':
                    this.handleAnswer(data.answer, data.candidates, data.username)
                    break
                case 'candidate':
                    this.handleCandidate(data.candidates, data.username)
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

    handleNewUser = (users) => {
        users = users.filter(user => user !== this.state.username)
        this.setState({
            otherUsers: users
        })
    }

    handleNewStream = (stream) => {
        console.log('got new stream', stream)
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

        this.setState({
            stream: stream
        })

        let newRTCpeer = new RTCPeerConnection(configuration)

        this.setState({
            localRTC: newRTCpeer
        })

        newRTCpeer.onnegotiationneeded = (event) => {
            console.log('negotiation needed', event)
        }

        this.setUpRTCIceHandler(newRTCpeer)
        this.setUpRTCPeerMedia(newRTCpeer)

    }

    connectToAll = async () => {      
        let rtcPeer = this.state.localRTC

        let offer = null
        try {
            offer = await rtcPeer.createOffer()
        } catch (error) {
            console.log("error creating offer")
            console.error(error)
        }   
        
        rtcPeer.setLocalDescription(offer)
        this.setState({
            localOffer: offer
        })
    }

    handleOffer = async (offer, incomingUsername) => {
        console.log('incoming offer from sever', offer)
        let newRTCpeer = new RTCPeerConnection(configuration)

        this.setUpRTCPeerMedia(newRTCpeer)
        this.setUpRTCIceHandler(newRTCpeer)

        newRTCpeer.setRemoteDescription(offer)

        let answer = null
        try {
            answer = await newRTCpeer.createAnswer()
        } catch (error) {
            console.log("error creating answer")
            console.error(error)
        }

        newRTCpeer.setLocalDescription(answer)

        let peers = {...this.state.peers}

        peers[incomingUsername] = newRTCpeer

        this.setState({
            peers: peers
        })

        this.sendMessage({
            type: 'answer',
            answer: answer,
            username: this.state.username,
            answerToUsername: incomingUsername
        })
    }

    handleAnswer = (answer, candidates, incomingUsername) => {
        // let peers = {...this.state.peers}
        // let rtcPeer = peers[incomingUsername]

        let rtcPeer = this.state.localRTC

        rtcPeer.setRemoteDescription(new RTCSessionDescription(answer))

        candidates.forEach((candidate) => {
            rtcPeer.addIceCandidate(new RTCIceCandidate(candidate))
        })
    }

    handleCandidate = (candidates, incomigUsername) => {
        // let peers = {...this.state.peers}
        // let rtcPeer = peers[incomingUsername]
        let rtcPeer = this.state.localRTC
        candidates.forEach((candidate) => {
            rtcPeer.addIceCandidate(new RTCIceCandidate(candidate))
        })
    }

    videoError = (err) => {
        alert(err)
    }

    render() {
        let streams = this.state.streams
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
                        <Button onClick={this.getStreams} variant="outline-primary">Get Streams</Button>
                    </Col>
                        { 
                            streams.map(stream => (
                                <Col key={stream.id}>
                                    <Stream srcObject={stream.media}/>
                                    <Button variant="outline-primary">Connect</Button>
                                    <Button variant="outline-primary">Disconnect</Button>
                                </Col>
                            ))
                        }
                </Row>

            </Container>
        )
    }
}

export default VideoBox;