import React from 'react';
import { Col, Row, Container, Button } from 'react-bootstrap';

class VideoBox extends React.Component {
   state = {
       source: ""
   };

   componentDidMount() {
       navigator.mediaDevices.getUserMedia({video: true, audio: true})
       .then(this.handleVideo)
       .catch(this.videoError); 
   }

   handleVideo = (stream) => {
       this.setState({
           source: window.URL.createObjectURL(stream)
       });
   }

   videoError = (err) => {
       alert(err)
   }

    render() {
        return (
            <Container>
                <Row>
                    <Col>
                        <video style={ {height: 350, backgroundColor: 'gray'} } src={this.state.source} autoplay={true}></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                    <Col>
                        <video style={ {height: 350, backgroundColor: 'gray'} }></video>
                        <Button variant="outline-primary">Connect</Button>
                        <Button variant="outline-primary">Disconnect</Button>
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default VideoBox;