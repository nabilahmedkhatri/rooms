import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'
// eslint-disable-next-line
import { Form, FormControl } from 'react-bootstrap'

const ws = new WebSocket('ws://192.168.1.237:8080')

// eslint-disable-next-line
let connection = null
let username = null
let otherUsername = null
let usernameLocal = null
let usernameRemote = null
let stream = null


class VideoBox extends React.Component {
    constructor(props) {
        super(props)
        this.videoTagLocal = React.createRef()
        this.videoTagRemote = React.createRef()
        this.videoTagRemote2 = React.createRef()
        this.state = {
            username: "",
            usernameLocal: "",
            usernameRemote: "",
            otherUsername: "",
            connections: {},
            connection_count: 0
        }

    }

    change = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        },
        () =>{
            this.setState({
                usernameLocal: this.state.username+'local',
                usernameRemote: this.state.username+'remote'
            })
        })
    }

    login = () => {
        console.log(this.state.username)
        username = this.state.username
        this.sendMessage({
            type: 'login',
            username: this.state.username
        })

    }

    sendMessage = message => {
        if (otherUsername) {
            message.otherUsername = otherUsername
        }
        console.log("in send message: ", username)
        if (username) {
            message.username = username
        }

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
            // eslint-disable-next-line
            const data = JSON.parse(msg.data)

            switch (data.type) {
                case 'login':
                    this.handleLogin(data.success)
                    break
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
                default:
                    console.log("default switch")

            }
        }

    }

    createConnection = (e) => {
        e.preventDefault();
        console.log('The link was clicked.');

        otherUsername = this.state.otherUsername
        username = this.state.username
        // create an offer

        var connections = {...this.state.connections}

        usernameLocal = this.state.usernameLocal
        usernameRemote = this.state.usernameRemote

        this.setState({
            connection_count: this.state.connection_count + 1
        })

        console.log(connections)

        connections[usernameLocal].createOffer(
            offer => {
                this.sendMessage({
                    type: 'offer',
                    offer: offer
                })
                connections[usernameLocal].setLocalDescription(offer)
                connections[usernameRemote].setRemoteDescription(offer)
            },
            error => {
                alert('Error when creating an offer')
                console.error(error)
            }
        )

        this.setState({connections})
    }

    handleOffer = async (offer, username) => {
        
        username = this.state.username


        var connections = {...this.state.connections}

        connections[usernameLocal].setRemoteDescription(new RTCSessionDescription(offer))

        connections[usernameLocal].createAnswer(
            answer => {
                connections[usernameRemote].setLocalDescription(answer)
                connections[usernameLocal].setRemoteDescription(answer)
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

        this.setState({connections})
    }



    handleLogin = async (success) => {
        if (!success) {
            console.error("no good")
        }
        let stream
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
        } catch (error) {
            alert(`${error.name}`)
            console.log("error here")
            console.error(error)
        }
        this.videoTagLocal.current.srcObject = stream;


        const configuration = {
            iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
        }

        var connections = {...this.state.connections}
        usernameLocal = this.state.usernameLocal 
        usernameRemote = this.state.usernameRemote

        connections[usernameLocal] = new RTCPeerConnection(configuration)
        connections[usernameRemote] = new RTCPeerConnection(configuration)

        console.log(connections)


        // stream.getTracks().forEach((track) => {
        //     connections[username].addTrack(track, stream)
        //     this.videoTagRemote.current.srcObject = event.stream;
        // })

        
        connections[usernameLocal].peerNumber = 0
        connections[usernameRemote].peerNumber = 0



        // connections[username].addStream(stream)

        // connections[username].onaddstream = event => {
        //     if (this.state.connection_count == 0 || this.state.connection_count == 1) {
        //         this.videoTagRemote.current.srcObject = event.stream;
        //     }
        //     else if (this.state.connection_count == 2) {
        //         this.videoTagRemote2.current.srcObject = event.stream;
        //     }
        // }

        connections[usernameRemote].ontrack = event => {
            // if (this.state.connection_count == 0 || this.state.connection_count == 1) {
            //     this.videoTagRemote.current.srcObject = event.stream[0];
            // }
            // else if (this.state.connection_count == 2) {
            //     this.videoTagRemote2.current.srcObject = event.stream[0];
            // }
            console.log(event.stream)
        }

        // connections[username].onnegotiationneeded = async () => {
        //     try {
        //         await connections[username].setLocalDescription(await pc.createOffer());
        //         // send the offer to the other peer
        //         this.sendMessage({type: pc.localDescription});
        //       } catch (err) {
        //         console.error(err);
        //       } 
        // }

        connections[usernameLocal].onicecandidate = event => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'candidate',
                    candidate: event.candidate
                })
            }
        }

        connections[usernameRemote].onicecandidate = event => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'candidate',
                    candidate: event.candidate
                })
            }
        }

        stream.getTracks().forEach((track) => {
            connections[usernameLocal].addTrack(track, stream)
            // this.videoTagRemote.current.srcObject = event.stream;
        })

        this.setState({connections})

    }

    handleAnswer = answer => {
        var connections = {...this.state.connections}

        usernameLocal = this.state.usernameLocal
        usernameRemote = this.state.usernameRemote

        connections[usernameRemote].setLocalDescription(new RTCSessionDescription(answer))
        connections[usernameLocal].setRemoteDescription(new RTCSessionDescription(answer))
        this.setState({connections})
    }

    handleCandidate = candidate => {
        var connections = {...this.state.connections}

        usernameLocal = this.state.usernameLocal
        usernameRemote = this.state.usernameRemote

        connections[usernameLocal].addIceCandidate(new RTCIceCandidate(candidate))
        connections[usernameRemote].addIceCandidate(new RTCIceCandidate(candidate))
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
                        <video muted style={{ width: "100%" }} ref={this.videoTagLocal} autoPlay></video>
                        <Form.Control onChange={this.change} name='username' type="text" placeholder="Your username" />
                        <Button onClick={this.login} variant="outline-primary">Login</Button>
                        <Form.Control onChange={this.change} name='otherUsername' type="text" placeholder="Connect to" />
                        <Button onClick={this.createConnection} variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                    <Col>
                        <video style={{ width: "100%" }} ref={this.videoTagRemote} autoPlay></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                    <Col>
                        <video style={{ width: "100%" }} ref={this.videoTagRemote2} autoPlay></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default VideoBox;