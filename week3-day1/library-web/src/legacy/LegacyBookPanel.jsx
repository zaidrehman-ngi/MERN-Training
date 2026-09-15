/**
 * LegacyBookPanel.jsx
 * Week 2, Day 2 — used by Exercise 1 and Exercise 2.
 *
 * Pulled out of the library's old admin panel. Written in 2019, still in
 * production, nobody has touched it since the developer who wrote it left.
 *
 * It works. That is the only nice thing anyone can say about it.
 *
 * Two instructions before you start:
 *   1. Read the whole file before you change a single line of it. Exercise 1
 *      task 1 asks you to plan on paper first, and you cannot plan what you
 *      have not read.
 *   2. Do not fix the bug you find. Exercise 2 asks you to make it happen on
 *      purpose and explain it. Fixing it early just means you fix it without
 *      understanding it.
 *
 * Drop this file into src/legacy/ and render it from App with some props.
 */

import React from "react";

class LegacyBookPanel extends React.Component {
  constructor(props) {
    super(props);
    this.handleFilterClick = this.handleFilterClick.bind(this);
    // this.handleBorrowClick = this.handleBorrowClick.bind(this);
  }

  handleFilterClick(filter) {
    this.props.onFilterChange(filter);
  }

  handleBorrowClick(bookId) {
    console.log("Value received:", bookId);
    this.props.onBorrow(bookId);
  }

  //   handleBorrowClick = (bookId) => {
  //     console.log("Value received:", bookId);
  //     this.props.onBorrow(bookId);
  //   };

  renderBadge(book) {
    if (book.onShelf === 0) {
      return <span className="badge badge--out">All copies out</span>;
    }
    return (
      <span className="badge badge--in">
        {book.onShelf} of {book.totalCopies} on shelf
      </span>
    );
  }

  render() {
    return (
      <div className="panel">
        <div className="panel__head">
          <div className="panel__head-left">
            <h2 className="panel__title">{this.props.title}</h2>
            <p className="panel__subtitle">
              {this.props.branchName} &middot; {this.props.books.length} titles
            </p>
          </div>
          <div className="panel__head-right">
            <button
              className="chip"
              onClick={() => this.handleFilterClick("all")}
            >
              All
            </button>
            <button
              className="chip"
              onClick={() => this.handleFilterClick("available")}
            >
              Available
            </button>
            <button
              className="chip"
              onClick={() => this.handleFilterClick("overdue")}
            >
              Overdue
            </button>
          </div>
        </div>

        <div className="panel__body">
          {this.props.books.map(function (book) {
            return (
              <div className="row" key={book.id}>
                <div className="row__cover">
                  <img src={book.coverUrl} alt={book.title + " cover"} />
                </div>
                <div className="row__main">
                  <h3 className="row__title">{book.title}</h3>
                  <p className="row__author">
                    {book.author} &middot; {book.year}
                  </p>
                  <p className="row__isbn">ISBN {book.isbn}</p>
                </div>
                <div className="row__side">
                  <span className="badge">
                    {book.onShelf} of {book.totalCopies} on shelf
                  </span>
                  <p className="row__fine">Rs {book.finePerDay} per day late</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel__foot">
          <p className="panel__note">
            Showing {this.props.books.length} of {this.props.totalCount} titles
            held at {this.props.branchName}.
          </p>
          <button className="btn" onClick={() => this.handleBorrowClick()}>
            Borrow selected
          </button>
        </div>
      </div>
    );
  }
}

export default LegacyBookPanel;

/*
 * Sample props, so you can render it today without a backend.
 * Copy this into App.jsx.
 *
 *   const books = [
 *     { id: 'bk-1', title: 'Dune', author: 'Frank Herbert', year: 1965,
 *       isbn: '9780441013593', coverUrl: '/covers/dune.jpg',
 *       onShelf: 3, totalCopies: 5, finePerDay: 20 },
 *     { id: 'bk-2', title: 'Neuromancer', author: 'William Gibson', year: 1984,
 *       isbn: '9780441569595', coverUrl: '/covers/neuromancer.jpg',
 *       onShelf: 0, totalCopies: 2, finePerDay: 20 },
 *     { id: 'bk-3', title: 'Hyperion', author: 'Dan Simmons', year: 1989,
 *       isbn: '9780553283686', coverUrl: '/covers/hyperion.jpg',
 *       onShelf: 1, totalCopies: 4, finePerDay: 20 },
 *   ];
 *
 *   <LegacyBookPanel
 *     title="Catalogue"
 *     branchName="Clifton Branch"
 *     books={books}
 *     totalCount={1284}
 *     onFilterChange={(f) => console.log('filter:', f)}
 *     onBorrow={(id) => console.log('borrow:', id)}
 *   />
 */
