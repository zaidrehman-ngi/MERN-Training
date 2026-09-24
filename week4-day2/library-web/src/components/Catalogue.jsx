import React from "react";
import BookList from "./BookList";

class Catalogue extends React.Component {
  state = {
    selectedFilter: "all",
  };

  handleFilterChange = (filter) => {
    this.setState({
      selectedFilter: filter,
    });
  };

  getFilteredBooks() {
    const { books } = this.props;
    const { selectedFilter } = this.state;

    if (selectedFilter === "available") {
      return books.filter((book) => book.onShelf > 0);
    }

    if (selectedFilter === "overdue") {
      return books.filter((book) => book.onShelf === 0);
    }

    return books;
  }

  render() {
    return (
      <div>
        <button onClick={() => this.handleFilterChange("all")}>All</button>

        <button onClick={() => this.handleFilterChange("available")}>
          Available
        </button>

        <button onClick={() => this.handleFilterChange("overdue")}>
          Overdue
        </button>

        <BookList books={this.getFilteredBooks()} />
      </div>
    );
  }
}

export default Catalogue;
