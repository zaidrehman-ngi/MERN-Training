import BookCard from "./BookCard";

const galleryBooks = [
  {
    id: "gallery-available",
    title: "Available",
    author: "Frank Herbert",
    year: 1965,
    coverUrl: "/covers/dune.jpg",
    status: "available",
  },
  {
    id: "gallery-out",
    title: "All Copies Out",
    author: "William Gibson",
    year: 1984,
    coverUrl: "/covers/neuromancer.jpg",
    status: "out",
  },
  {
    id: "gallery-overdue",
    title: "Overdue",
    author: "Dan Simmons",
    year: 1989,
    coverUrl: "/covers/hyperion.jpg",
    status: "overdue",
  },
  {
    id: "gallery-no-cover",
    title: "No Cover",
    author: "Test Author",
    year: 2000,
    coverUrl: null,
    status: "available",
  },
  {
    id: "gallery-no-author",
    title: "No Author",
    author: null,
    year: 2001,
    coverUrl: "/covers/dune.jpg",
    status: "available",
  },
  {
    id: "gallery-long-title",
    title:
      "A Comprehensive and Illustrated Survey of the Coastal Flora of Sindh and Balochistan, With Notes on Seasonal Variation and an Appendix of Local Names in Six Languages",
    author: "M. A. Qureshi",
    year: 1994,
    coverUrl: "/covers/flora.jpg",
    status: "out",
  },
  {
    id: "gallery-minimal",
    title: "Minimal Record",
    author: null,
    year: null,
    coverUrl: null,
    status: "available",
  },
];

function Gallery() {
  const handleSelect = (book) => {
    console.log("Selected gallery book:", book);
  };

  return (
    <section>
      <h2>BookCard Gallery</h2>

      <div className="book-card-gallery">
        {galleryBooks.map((book) => (
          <div key={book.id}>
            <h3>{book.title}</h3>

            <BookCard book={book} onSelect={handleSelect} variant="default" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Gallery;
