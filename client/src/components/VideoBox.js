import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'

const ws = new WebSocket('ws://localhost:8080')

const configuration = {
    iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
}

var connection = new RTCPeerConnection(configuration)
var otherUserName = "self"

class VideoBox extends React.Component {
    constructor(props) {
        super(props)
        this.videoTagLocal = React.createRef()
        this.videoTagRemote = React.createRef()
        this.createConnection = this.createConnection.bind(this)

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

    createConnection = (e) => {
        e.preventDefault();
        console.log('The link was clicked.');
        this.sendMessage('connection')

        this.sendMessage({ type: 'login' })
        // create an offer
        connection.createOffer(
            offer => {
                this.sendMessage({
                    type: 'offer',
                    offer: offer
                })
                connection.setLocalDescription(offer)
            },
            error => {
                alert('Error when creating an offer')
                console.error(error)
            }
        )


    }

    handleOffer = (offer, username) => {
        var otherUsername = username
        console.log('handling offer ' + offer)
        connection.setRemoteDescription(new RTCSessionDescription(offer))
        console.log("this is the offer", offer)
        connection.createAnswer(
            answer => {
                connection.setLocalDescription(answer)
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
        let stream
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
        } catch (error) {
            alert(`${error.name}`)
            console.error(error)
        }
        this.videoTagLocal.current.srcObject = stream;

        connection.addStream(stream)

        connection.onaddstream = event => {
            this.videoTagRemote.current.srcObject = event.stream;
        }

        connection.onicecandidate = event => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'candidate',
                    candidate: event.candidate
                })
            }
        }

    }

    handleAnswer = answer => {
        connection.setRemoteDescription(new RTCSessionDescription(answer))
    }

    handleCandidate = candidate => {
        connection.addIceCandidate(new RTCIceCandidate(candidate))
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
                        <Button onClick={this.createConnection} variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
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