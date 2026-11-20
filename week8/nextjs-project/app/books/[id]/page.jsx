import { notFound } from "next/navigation";
import { getBook } from "../../../lib/books";
import BookDetails from "../../../components/BookDetails";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const book = (await getBook(id)).data;
    const description = `${book.title} by ${book.author ?? "Unknown author"}${book.year ? `, ${book.year}` : ""}. Available at Karachi Central Library.`;

    return {
      title: `${book.title} | Karachi Central Library`,
      description,
      openGraph: { title: book.title, description },
    };
  } catch {
    return { title: "Book Not Found | Karachi Central Library" };
  }
}

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
