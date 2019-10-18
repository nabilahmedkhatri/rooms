import React from 'react';
import Navbar from 'react-bootstrap/Navbar'

class NavBar extends React.Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="#home">
                Rooms
                </Navbar.Brand>
            </Navbar>
        )
    }
}

export default NavBar;