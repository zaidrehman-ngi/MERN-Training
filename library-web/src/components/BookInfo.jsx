function BookInfo({ title, author, year, isbn }) {
  return (
    <div className="row__main">
      <h3 className="row__title">{title}</h3>

      <p className="row__author">
        {author} &middot; {year}
      </p>

      <p className="row__isbn">ISBN {isbn}</p>
    </div>
  );
}

export default BookInfo;
