import useForm from "../../hooks/useForm";
import styles from "./AddBook.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createBookThunk, resetBookMutation, updateBookThunk } from "../../store/booksSlice";
import { getBook } from "../../api/books";
import { useEffect, useState } from "react";

function AddBook() {
  const { id } = useParams();
  const [loadedBook, setLoadedBook] = useState(null);
  const book = id && loadedBook?.id === id ? loadedBook.book : null;
  const loadStatus = id
    ? loadedBook?.id === id
      ? loadedBook.status
      : "loading"
    : "succeeded";

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;
    getBook(id)
      .then((response) => {
        if (active) {
          setLoadedBook({ id, book: response.data, status: "succeeded" });
        }
      })
      .catch((error) => {
        if (active) {
          setLoadedBook({ id, error, status: "failed" });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loadStatus === "loading") {
    return <main className={styles.page}><p role="status">Loading book...</p></main>;
  }

  if (loadStatus === "failed") {
    return (
      <main className={styles.page}>
        <p role="alert">
          {loadedBook?.error?.message || "Unable to load this book."}
        </p>
      </main>
    );
  }

  return <BookForm key={book?.id ?? "new"} book={book} />;
}

function BookForm({ book }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) =>
    book ? state.books.updateStatusById[book.id] ?? "idle" : state.books.createStatus,
  );
  const mutationError = useSelector((state) =>
    book ? state.books.updateErrorById[book.id] : state.books.createError,
  );

  useEffect(() => {
    dispatch(
      resetBookMutation({ operation: book ? "update" : "create", id: book?.id }),
    );
  }, [book, dispatch]);

  const initialValues = {
    title: book?.title ?? "",
    author: book?.author ?? "",
    isbn: book?.isbn ?? "",
    copies: book?.onShelf == null ? "" : String(book.onShelf),
    totalCopies: book?.totalCopies == null ? "" : String(book.totalCopies),
    status: book?.status ?? "available",
    branch: book?.branch ?? "",
  };

  function validateTitle(value) {
    if (!value.trim()) {
      return "Please enter a book title.";
    }

    return "";
  }

  function validateAuthor(value) {
    if (!value.trim()) {
      return "Please enter the author name.";
    }

    return "";
  }

  function validateIsbn(value) {
    const isbnPattern = /^978\d{10}$/;

    if (!value.trim() || !isbnPattern.test(value)) {
      return "ISBN is not valid.";
    }

    return "";
  }

  function validateCopies(value) {
    if (value === "" || Number(value) < (book ? 0 : 1)) {
      return book
        ? "Available copies cannot be negative."
        : "Copies must be at least 1.";
    }

    if (book && Number(value) > Number(book.totalCopies)) {
      return "Available copies cannot exceed total copies.";
    }

    return "";
  }

  function validateTotalCopies(value, values) {
    if (!book) {
      return "";
    }

    if (value === "" || Number(value) < Number(values.copies)) {
      return "Total copies cannot be fewer than available copies.";
    }

    return "";
  }

  function validateBranch(value) {
    if (!value) {
      return "Please select a branch.";
    }

    return "";
  }

  const validate = (values) => ({
    title: validateTitle(values.title),
    author: validateAuthor(values.author),
    isbn: validateIsbn(values.isbn),
    copies: validateCopies(values.copies),
    totalCopies: validateTotalCopies(values.totalCopies, values),
    branch: book ? "" : validateBranch(values.branch),
    status: "",
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    submitError,
  } = useForm({
    initialValues,
    validate,
    onSubmit: async (values) => {
      const payload = {
        ...(book ?? {}),
          title: values.title,
          author: values.author,
          isbn: values.isbn,
          onShelf: Number(values.copies),
        ...(!book
          ? {
              totalCopies: Number(values.copies),
              status: "available",
              branch: values.branch,
            }
            : {
                totalCopies: Number(values.totalCopies),
                status: values.status,
              }),
      };
      const request = book
        ? dispatch(updateBookThunk({ id: book.id, book: payload }))
        : dispatch(createBookThunk(payload));
      const result = await request;

      if (
        (book && updateBookThunk.fulfilled.match(result)) ||
        (!book && createBookThunk.fulfilled.match(result))
      ) {
        navigate(book ? `/books/${book.id}` : "/books");
        return;
      }

      throw result.payload;
    },
  });

  return (
    <main className={styles.page}>
      <h1>{book ? "Edit Book" : "Add a Book"}</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={values.title}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.title && !!errors.title}
          className={styles.control}
          aria-describedby={
            touched.title && errors.title ? "title-error" : undefined
          }
        />
        {touched.title && errors.title && (
          <p className={styles.error} id="title-error">
            {errors.title}
          </p>
        )}

        <label className={styles.label} htmlFor="author">
          Author
        </label>
        <input
          id="author"
          type="text"
          name="author"
          value={values.author}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.author && !!errors.author}
          className={styles.control}
          aria-describedby={
            touched.author && errors.author ? "author-error" : undefined
          }
        />
        {touched.author && errors.author && (
          <p className={styles.error} id="author-error">
            {errors.author}
          </p>
        )}

        <label className={styles.label} htmlFor="isbn">
          ISBN
        </label>
        <input
          id="isbn"
          type="text"
          name="isbn"
          value={values.isbn}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.isbn && !!errors.isbn}
          className={styles.control}
          aria-describedby={
            touched.isbn && errors.isbn ? "isbn-error" : undefined
          }
        />
        {touched.isbn && errors.isbn && (
          <p className={styles.error} id="isbn-error">
            {errors.isbn}
          </p>
        )}

        <label className={styles.label} htmlFor="copies">
          Copies
        </label>
        <input
          id="copies"
          type="number"
          name="copies"
          min={book ? "0" : "1"}
          value={values.copies}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.copies && !!errors.copies}
          className={styles.control}
          aria-describedby={
            touched.copies && errors.copies ? "copies-error" : undefined
          }
        />
        {touched.copies && errors.copies && (
          <p className={styles.error} id="copies-error">
            {errors.copies}
          </p>
        )}

        {book && (
          <>
            <label className={styles.label} htmlFor="totalCopies">
              Total copies
            </label>
            <input
              id="totalCopies"
              type="number"
              name="totalCopies"
              min={values.copies || "0"}
              value={values.totalCopies}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.totalCopies && !!errors.totalCopies}
              className={styles.control}
              aria-describedby={
                touched.totalCopies && errors.totalCopies
                  ? "totalCopies-error"
                  : undefined
              }
            />
            {touched.totalCopies && errors.totalCopies && (
              <p className={styles.error} id="totalCopies-error">
                {errors.totalCopies}
              </p>
            )}

            <label className={styles.label} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={values.status}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.control}
            >
              {[...new Set(["available", "out", "overdue", values.status])]
                .filter(Boolean)
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </>
        )}

        {!book && (
          <>
            <label className={styles.label} htmlFor="branch">
              Branch
            </label>
            <select
              id="branch"
              name="branch"
              value={values.branch}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.branch && !!errors.branch}
              className={styles.control}
              aria-describedby={
                touched.branch && errors.branch ? "branch-error" : undefined
              }
            >
              <option value="">Select a branch</option>
              <option value="clifton">Clifton</option>
              <option value="defence">Defence</option>
              <option value="gulshan">Gulshan</option>
            </select>
            {touched.branch && errors.branch && (
              <p className={styles.error} id="branch-error">
                {errors.branch}
              </p>
            )}
          </>
        )}

        {(submitError || mutationError) && (
          <p className={styles.error} role="alert">
            {submitError || mutationError.message}
          </p>
        )}

        <button
          className={styles.submit}
          type="submit"
          disabled={mutationStatus === "loading"}
        >
          {mutationStatus === "loading"
            ? book
              ? "Saving..."
              : "Adding Book..."
            : book
              ? "Save Changes"
              : "Add Book"}
        </button>
      </form>
    </main>
  );
}

export default AddBook;
