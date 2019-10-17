import React from 'react'

class Stream extends React.Component {
    constructor(props) {
        super(props)
        this.videoTag = React.createRef()
    }

    componentDidMount = () => {
        this.videoTag.current.srcObject = this.props.srcObject
    }

    render() {
        return <video style={{ width: "100%" }} ref={this.videoTag} autoPlay></video>
    }
}

export default Stream