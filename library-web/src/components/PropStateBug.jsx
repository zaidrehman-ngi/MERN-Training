import React from "react";

class PropStateBug extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      onShelf: props.onShelf,
    };
  }

  render() {
    return <p>{this.state.onShelf} on shelf</p>;
  }
}

export default PropStateBug;
