const express = require('express');
const app = express(); 
const PORT = 4000; 
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    console.log("Request received")
    res.send({
        text: "Rooms"
    }); 
});

app.listen(PORT, () => {
    console.log("Server is running on port" + PORT); 
});

// websocket stuff
const webSocketsServerPort = 8080; 
const webSocketServer = require('websocket').server 
const http = require('http')

