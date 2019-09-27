import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

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
    let text = this.state.text

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>{text}</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  };
}

export default App;
