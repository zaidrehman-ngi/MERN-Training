import { notFound } from "next/navigation";
import { getBook } from "../../../lib/books";
import BookDetails from "../../../components/BookDetails";

export default async function BookDetail({ params }) {
  const { id } = await params;

  let book;
  try {
    book = (await getBook(id)).data;
  } catch (error) {
    if (error.status === 404 || error.status === 400) {
      notFound();
    }
    throw error;
  }

  return (
    <main>
      <section className="detailPanel">
        <h1>{book.title}</h1>
        <BookDetails book={book} />
      </section>
    </main>
  );
}
