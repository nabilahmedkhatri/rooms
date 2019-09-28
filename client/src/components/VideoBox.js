import React from 'react'
import { Col, Row, Container, Button } from 'react-bootstrap'

class VideoBox extends React.Component {
    constructor(props) {
        super(props)
        this.videoTag = React.createRef()
    }

    componentDidMount() {
       navigator.mediaDevices.getUserMedia({video: true, audio: true})
       .then(this.handleVideo)
       .catch(this.videoError)
    }

   handleVideo = (stream) => {
       this.videoTag.current.srcObject = stream
   }

   videoError = (err) => {
       alert(err)
   }

    render() {
        return (
            <Container>
                <Row>
                    <Col>
                        <video style={ {width: "100%"} } ref={this.videoTag} autoPlay></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                    <Col>
                        <video style={ {width: "100%"} } ref={this.videoTag} autoPlay></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default VideoBox;