import { useEffect, useState } from "react";
import { getCallCount, loadBooks } from "../data/mockApi";

function EffectLoop() {
  const [books, setBooks] = useState([]);

  //   useEffect(() => {
  //     loadBooks().then((books) => {
  //       setBooks(books);
  //     });
  //   });

  useEffect(() => {
    loadBooks().then((books) => {
      setBooks(books);
    });
  }, []);

  return (
    <div>
      <h2>Effect Loop Test</h2>
      <p>API call count: {getCallCount()}</p>
      <p>Books loaded: {books.length}</p>
    </div>
  );
}

export default EffectLoop;
