import { useState } from "react";
import useForm from "../../hooks/useForm";
import "./SupportTicketForm.css";

function SupportTicketForm() {
  const [submittedMessage, setSubmittedMessage] = useState("");

  const initialValues = {
    fullName: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
    urgent: false,
  };

  const validate = (values) => {
    const errors = {};

    if (!values.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!values.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!values.category) {
      errors.category = "Please choose a category.";
    }

    if (!values.subject.trim()) {
      errors.subject = "Subject is required.";
    }

    if (!values.message.trim()) {
      errors.message = "Please describe your issue.";
    } else if (values.message.trim().length < 20) {
      errors.message = "Message should be at least 20 characters long.";
    }

    return errors;
  };

  const onSubmit = async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmittedMessage(
      `Thanks ${values.fullName}! Your ${
        values.urgent ? "urgent " : ""
      }${values.category} ticket has been submitted.`,
    );

    resetForm();
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    isSubmitting,
    resetForm,
  } = useForm({
    initialValues,
    validate,
    onSubmit,
  });

  const showError = (field) => Boolean(touched[field] && errors[field]);

  return (
    <main className="support-ticket">
      <h1>Submit a Support Ticket</h1>

      <p className="support-ticket__description">
        Tell us what you need help with and we will get back to you soon.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="support-ticket__row">
          <div className="support-ticket__field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {showError("fullName") && (
              <p className="support-ticket__error">{errors.fullName}</p>
            )}
          </div>

          <div className="support-ticket__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {showError("email") && (
              <p className="support-ticket__error">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="support-ticket__field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="general">General</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="account">Account</option>
            <option value="feature">Feature Request</option>
          </select>

          {showError("category") && (
            <p className="support-ticket__error">{errors.category}</p>
          )}
        </div>

        <div className="support-ticket__field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={values.subject}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          {showError("subject") && (
            <p className="support-ticket__error">{errors.subject}</p>
          )}
        </div>

        <div className="support-ticket__field">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows="6"
            value={values.message}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          {showError("message") && (
            <p className="support-ticket__error">{errors.message}</p>
          )}
        </div>

        <div className="support-ticket__checkbox">
          <input
            id="urgent"
            name="urgent"
            type="checkbox"
            checked={Boolean(values.urgent)}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <label htmlFor="urgent">Mark this as urgent</label>
        </div>

        <div className="support-ticket__actions">
          <button type="submit" disabled={isSubmitting || !isValid}>
            {isSubmitting ? "Sending..." : "Submit ticket"}
          </button>

          <button type="button" onClick={resetForm}>
            Clear
          </button>
        </div>

        {submittedMessage && (
          <p className="support-ticket__success">{submittedMessage}</p>
        )}
      </form>
    </main>
  );
}

export default SupportTicketForm;
