import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../../api/auth";
import styles from "../Register/Register.module.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submission, setSubmission] = useState({
    status: "idle",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmission({ status: "loading", message: "" });

    try {
      await loginUser(form);
      setSubmission({
        status: "succeeded",
        message: "Login successful.",
      });
    } catch (error) {
      setSubmission({
        status: "failed",
        message: error.message || "Unable to log in.",
      });
    }
  };

  return (
    <main className={styles.page}>
      <h1>Login</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
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
          autoComplete="email"
          required
        />

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
          autoComplete="current-password"
          required
        />

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
          {submission.status === "loading" ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p>
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default Login;
