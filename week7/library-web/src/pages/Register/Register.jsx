import { useState } from "react";
import { Link } from "react-router-dom";
import { createUser } from "../../api/users";
import styles from "./Register.module.css";

const branches = ["Clifton Branch", "Saddar Branch", "Gulshan Branch"];

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch: "",
  });
  const [touched, setTouched] = useState({});
  const [submission, setSubmission] = useState({
    status: "idle",
    message: "",
  });

  const errors = {
    name: form.name.trim() ? "" : "Please enter a name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? ""
      : "Please enter a valid email address.",
    password:
      form.password.length >= 8
        ? ""
        : "Password must be at least 8 characters long.",
    confirmPassword:
      form.confirmPassword && form.confirmPassword === form.password
        ? ""
        : "Passwords do not match.",
    branch: branches.includes(form.branch) ? "" : "Please select a branch.",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((currentTouched) => ({ ...currentTouched, [name]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      branch: true,
    });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const now = new Date();
    const joined = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    setSubmission({ status: "loading", message: "" });

    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        branch: form.branch,
        role: "user",
        joined,
      });
      setSubmission({
        status: "succeeded",
        message: "Your account has been created.",
      });
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        branch: "",
      });
      setTouched({});
    } catch (error) {
      setSubmission({
        status: "failed",
        message: error.message || "Unable to create your account.",
      });
    }
  };

  const describedBy = (field) =>
    touched[field] && errors[field] ? `${field}-error` : undefined;

  return (
    <main className={styles.page}>
      <h1>User Registration</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          className={styles.control}
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={describedBy("name")}
          required
        />
        {touched.name && errors.name && (
          <p className={styles.error} id="name-error">
            {errors.name}
          </p>
        )}

        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.control}
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={describedBy("email")}
          required
        />
        {touched.email && errors.email && (
          <p className={styles.error} id="email-error">
            {errors.email}
          </p>
        )}

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.control}
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={describedBy("password")}
          autoComplete="new-password"
          minLength={8}
          required
        />
        {touched.password && errors.password && (
          <p className={styles.error} id="password-error">
            {errors.password}
          </p>
        )}

        <label className={styles.label} htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          className={styles.control}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
          aria-describedby={describedBy("confirmPassword")}
          autoComplete="new-password"
          minLength={8}
          required
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p className={styles.error} id="confirmPassword-error">
            {errors.confirmPassword}
          </p>
        )}

        <label className={styles.label} htmlFor="branch">
          Branch
        </label>
        <select
          className={styles.control}
          id="branch"
          name="branch"
          value={form.branch}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.branch && !!errors.branch}
          aria-describedby={describedBy("branch")}
          required
        >
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        {touched.branch && errors.branch && (
          <p className={styles.error} id="branch-error">
            {errors.branch}
          </p>
        )}

        {submission.message && (
          <p
            className={submission.status === "failed" ? styles.error : ""}
            role={submission.status === "failed" ? "alert" : "status"}
          >
            {submission.message}
          </p>
        )}

        <button
          className={styles.submit}
          type="submit"
          disabled={submission.status === "loading"}
        >
          {submission.status === "loading" ? "Creating..." : "Create User"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export default Register;
