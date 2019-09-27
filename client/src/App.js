import React from 'react';
// import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import NavBar from './components/NavBar'
import Container from 'react-bootstrap/Container'
import VideoBox from './components/VideoBox'

class App extends React.Component {
  constructor(props) {
    super(props)
    
    this.state = {
    text: ""
    }
  }

  componentDidMount() {
    console.log("This ran")
    axios.get('http://localhost:4000').then( res => {
        console.log(res.data)
        this.setState({
          text: res.data.text
        })
      })
  }
  
  render() {
    // let text = this.state.text

    return (
      <Container fluid={true} style={{ paddingLeft: 0, paddingRight: 0 }}>
      <NavBar></NavBar>
      <div className="App">
        <header className="App-header">
          <VideoBox></VideoBox>
        </header>
      </div>
      </Container>
    );
  };
}

export default App;
