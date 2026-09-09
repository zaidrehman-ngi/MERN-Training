function BookCover({ coverUrl, title }) {
  return (
    <div className="row__cover">
      <img src={coverUrl} alt={`${title} cover`} />
    </div>
  );
}

export default BookCover;
