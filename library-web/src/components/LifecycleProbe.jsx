import React from "react";

class LifecycleProbe extends React.Component {
  constructor(props) {
    super(props);
    console.log("LifecycleProbe: constructor");
  }

  componentDidMount() {
    console.log("LifecycleProbe: componentDidMount");

    this.intervalId = setInterval(() => {
      console.log("LifecycleProbe: interval still running");
    }, 1000);
  }

  componentDidUpdate() {
    console.log("LifecycleProbe: componentDidUpdate");
  }

  componentWillUnmount() {
    console.log("LifecycleProbe: componentWillUnmount");

    clearInterval(this.intervalId);
  }

  render() {
    console.log("LifecycleProbe: render");

    return (
      <div>
        <p>Lifecycle Probe</p>
        {this.props.children}
      </div>
    );
  }
}

export default LifecycleProbe;
