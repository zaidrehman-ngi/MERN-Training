import { useState } from "react";
import "./Register.css";

function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    homeBranch: "",
    membershipTier: "",
    agreeToTerms: false,
  });

  const [touched, setTouched] = useState({});

  const handleBlur = (e) => {
    const { name } = e.target;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleTermsChange = (e) => {
    setForm((currentForm) => ({
      ...currentForm,
      agreeToTerms: e.target.checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
      homeBranch: true,
      membershipTier: true,
      agreeToTerms: true,
    });

    const hasErrors = Object.values(errors).some((error) => error);

    if (hasErrors) {
      return;
    }

    console.log("Registration submitted:", form);
  };

  function validateFullName(value) {
    if (!value.trim()) {
      return "Please enter your full name.";
    }

    return "";
  }

  function validateEmail(value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value.trim() || !emailPattern.test(value)) {
      return "Please enter a valid email address.";
    }

    return "";
  }

  function validatePassword(value) {
    if (!value || value.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    return "";
  }

  function validateConfirmPassword(value, password) {
    if (!value || value !== password) {
      return "Passwords do not match. Please enter the same password again.";
    }

    return "";
  }

  function validatePhone(value) {
    const phonePattern = /^03\d{2}-?\d{7}$/;

    if (!value.trim() || !phonePattern.test(value)) {
      return "Please enter a valid phone number.";
    }

    return "";
  }

  function validateHomeBranch(value) {
    if (!value) {
      return "Please select your home branch.";
    }

    return "";
  }

  function validateMembershipTier(value) {
    if (!value) {
      return "Please select a membership tier.";
    }

    return "";
  }

  function validateAgreeToTerms(value) {
    if (!value) {
      return "Please agree to the terms and conditions.";
    }

    return "";
  }

  const errors = {
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(
      form.confirmPassword,
      form.password,
    ),
    phone: validatePhone(form.phone),
    homeBranch: validateHomeBranch(form.homeBranch),
    membershipTier: validateMembershipTier(form.membershipTier),
    agreeToTerms: validateAgreeToTerms(form.agreeToTerms),
  };

  return (
    <main>
      <h1>Membership Registration</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.fullName && !!errors.fullName}
          aria-describedby={
            touched.fullName && errors.fullName ? "fullName-error" : undefined
          }
        />
        {touched.fullName && errors.fullName && (
          <p id="fullName-error">{errors.fullName}</p>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={
            touched.email && errors.email ? "email-error" : undefined
          }
        />
        {touched.email && errors.email && (
          <p id="email-error">{errors.email}</p>
        )}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={
            touched.password && errors.password ? "password-error" : undefined
          }
        />
        {touched.password && errors.password && (
          <p id="password-error">{errors.password}</p>
        )}

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
          aria-describedby={
            touched.confirmPassword && errors.confirmPassword
              ? "confirmPassword-error"
              : undefined
          }
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p id="confirmPassword-error">{errors.confirmPassword}</p>
        )}

        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.phone && !!errors.phone}
          aria-describedby={
            touched.phone && errors.phone ? "phone-error" : undefined
          }
        />
        {touched.phone && errors.phone && (
          <p id="phone-error">{errors.phone}</p>
        )}

        <label htmlFor="homeBranch">Home Branch</label>
        <select
          id="homeBranch"
          name="homeBranch"
          value={form.homeBranch}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.homeBranch && !!errors.homeBranch}
          aria-describedby={
            touched.homeBranch && errors.homeBranch
              ? "homeBranch-error"
              : undefined
          }
        >
          <option value="">Select a branch</option>
          <option value="clifton">Clifton</option>
          <option value="defence">Defence</option>
          <option value="gulshan">Gulshan</option>
        </select>
        {touched.homeBranch && errors.homeBranch && (
          <p id="homeBranch-error">{errors.homeBranch}</p>
        )}

        <fieldset>
          <legend>Membership Tier</legend>

          <label htmlFor="standard">
            <input
              id="standard"
              type="radio"
              name="membershipTier"
              value="standard"
              checked={form.membershipTier === "standard"}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.membershipTier && !!errors.membershipTier}
              aria-describedby={
                touched.membershipTier && errors.membershipTier
                  ? "membershipTier-error"
                  : undefined
              }
            />
            Standard
          </label>

          <label htmlFor="premium">
            <input
              id="premium"
              type="radio"
              name="membershipTier"
              value="premium"
              checked={form.membershipTier === "premium"}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.membershipTier && !!errors.membershipTier}
              aria-describedby={
                touched.membershipTier && errors.membershipTier
                  ? "membershipTier-error"
                  : undefined
              }
            />
            Premium
          </label>

          {touched.membershipTier && errors.membershipTier && (
            <p id="membershipTier-error">{errors.membershipTier}</p>
          )}
        </fieldset>

        <label htmlFor="agreeToTerms">
          <input
            id="agreeToTerms"
            type="checkbox"
            name="agreeToTerms"
            checked={form.agreeToTerms}
            onChange={handleTermsChange}
            onBlur={handleBlur}
            aria-invalid={touched.agreeToTerms && !!errors.agreeToTerms}
            aria-describedby={
              touched.agreeToTerms && errors.agreeToTerms
                ? "agreeToTerms-error"
                : undefined
            }
          />
          I agree to the terms and conditions
        </label>

        {touched.agreeToTerms && errors.agreeToTerms && (
          <p id="agreeToTerms-error">{errors.agreeToTerms}</p>
        )}

        <button type="submit">Create Membership</button>
      </form>
    </main>
  );
}

export default Register;
