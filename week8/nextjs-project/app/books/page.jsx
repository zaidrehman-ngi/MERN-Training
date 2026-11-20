import Books from "../../components/Books";
import { listBooks } from "../../lib/books";

export default async function BooksPage({ searchParams }) {
  const { status = "all", q = "", page = "1" } = await searchParams;
  const current = Math.max(1, Number(page) || 1);

  const { data, meta } = await listBooks({
    filter: status,
    search: q,
    page: current,
  });

  return (
    <Books
      books={data}
      total={meta.total}
      filter={status}
      search={q}
      page={current}
      pageCount={Math.max(1, Math.ceil(meta.total / meta.limit))}
    />
  );
}
