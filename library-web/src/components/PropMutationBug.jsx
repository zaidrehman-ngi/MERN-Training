import React from "react";

class PropMutationBug extends React.Component {
  render() {
    this.props.book.onShelf = 0;

    return <p>{this.props.book.onShelf} on shelf</p>;
  }
}

export default PropMutationBug;
