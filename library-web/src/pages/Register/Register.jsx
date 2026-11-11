import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createUser } from "../../api/users";
import { listBranches } from "../../api/branches";
import useForm from "../../hooks/useForm";
import styles from "./Register.module.css";

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  branch: "",
};

const today = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

function Register() {
  const [branches, setBranches] = useState([]);
  const [branchesError, setBranchesError] = useState("");
  const [serverErrors, setServerErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    listBranches()
      .then((response) => {
        setBranches(response.data.data.map((branch) => branch.name));
      })
      .catch(() => {
        setBranchesError(
          "Could not load branches. Refresh the page to try again.",
        );
      });
  }, []);

  const validate = (values) => ({
    name: values.name.trim() ? "" : "Please enter a name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
      ? ""
      : "Please enter a valid email address.",
    password:
      values.password.length >= 8
        ? ""
        : "Password must be at least 8 characters long.",
    confirmPassword:
      values.confirmPassword && values.confirmPassword === values.password
        ? ""
        : "Passwords do not match.",
    branch: branches.includes(values.branch) ? "" : "Please select a branch.",
  });

  const submit = async (values) => {
    setServerErrors({});
    setSuccessMessage("");

    try {
      const response = await createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        branch: values.branch,
        joined: today(),
      });
      setSuccessMessage(response.data.message);
      resetForm();
    } catch (error) {
      const fieldErrors = {};
      for (const detail of error.details ?? []) {
        if (detail.field in initialValues && !fieldErrors[detail.field]) {
          fieldErrors[detail.field] = detail.message;
        }
      }

      if (Object.keys(fieldErrors).length === 0) {
        throw error;
      }
      setServerErrors(fieldErrors);
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    submitError,
    resetForm,
  } = useForm({ initialValues, validate, onSubmit: submit });

  const handleFieldChange = (event) => {
    const { name } = event.target;
    setServerErrors((current) => ({ ...current, [name]: "" }));
    setSuccessMessage("");
    handleChange(event);
  };

  const errorFor = (field) =>
    serverErrors[field] || (touched[field] ? errors[field] : "");

  const fieldProps = (field) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: handleFieldChange,
    onBlur: handleBlur,
    className: styles.control,
    "aria-invalid": !!errorFor(field),
    "aria-describedby": errorFor(field) ? `${field}-error` : undefined,
    required: true,
  });

  const fieldError = (field) =>
    errorFor(field) && (
      <p className={styles.error} id={`${field}-error`}>
        {errorFor(field)}
      </p>
    );

  return (
    <main className={styles.page}>
      <h1>User Registration</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input {...fieldProps("name")} type="text" />
        {fieldError("name")}

        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input {...fieldProps("email")} type="email" />
        {fieldError("email")}

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          {...fieldProps("password")}
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        {fieldError("password")}

        <label className={styles.label} htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          {...fieldProps("confirmPassword")}
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        {fieldError("confirmPassword")}

        <label className={styles.label} htmlFor="branch">
          Branch
        </label>
        <select {...fieldProps("branch")}>
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        {branchesError && <p className={styles.error}>{branchesError}</p>}
        {fieldError("branch")}

        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}
        {successMessage && <p role="status">{successMessage}</p>}

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create User"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export default Register;
