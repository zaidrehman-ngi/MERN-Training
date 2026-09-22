import useForm from "../../hooks/useForm";
import styles from "./AddBook.module.css";
import { useNavigate } from "react-router-dom";

function AddBook() {
  const navigate = useNavigate();

  const initialValues = {
    title: "",
    author: "",
    isbn: "",
    copies: "",
    branch: "",
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
    if (!value || Number(value) < 1) {
      return "Copies must be at least 1.";
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
    branch: validateBranch(values.branch),
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm({
      initialValues,
      validate,
      onSubmit: (values) => {
        console.log("Book submitted:", values);
        navigate("/books");
      },
    });

  return (
    <main className={styles.page}>
      <h1>Add a Book</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="title">Title</label>
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
          <p className={styles.error} id="title-error">{errors.title}</p>
        )}

        <label className={styles.label} htmlFor="author">Author</label>
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
          <p className={styles.error} id="author-error">{errors.author}</p>
        )}

        <label className={styles.label} htmlFor="isbn">ISBN</label>
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
          <p className={styles.error} id="isbn-error">{errors.isbn}</p>
        )}

        <label className={styles.label} htmlFor="copies">Copies</label>
        <input
          id="copies"
          type="number"
          name="copies"
          min="1"
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
          <p className={styles.error} id="copies-error">{errors.copies}</p>
        )}

        <label className={styles.label} htmlFor="branch">Branch</label>
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
          <p className={styles.error} id="branch-error">{errors.branch}</p>
        )}

        <button className={styles.submit} type="submit">Add Book</button>
      </form>
    </main>
  );
}

export default AddBook;
