import useForm from "../hooks/useForm";
import "./Register.css";

function Register() {
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

  const validate = (values) => ({
    fullName: validateFullName(values.fullName),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword: validateConfirmPassword(
      values.confirmPassword,
      values.password,
    ),
    phone: validatePhone(values.phone),
    homeBranch: validateHomeBranch(values.homeBranch),
    membershipTier: validateMembershipTier(values.membershipTier),
    agreeToTerms: validateAgreeToTerms(values.agreeToTerms),
  });

  const initialValues = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    homeBranch: "",
    membershipTier: "",
    agreeToTerms: false,
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm({
      initialValues,
      validate,
      onSubmit: (values) => {
        console.log("Registration submitted:", values);
      },
    });

  return (
    <main>
      <h1>Membership Registration</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          name="fullName"
          value={values.fullName}
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
          value={values.email}
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
          value={values.password}
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
          value={values.confirmPassword}
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
          value={values.phone}
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
          value={values.homeBranch}
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
              checked={values.membershipTier === "standard"}
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
              checked={values.membershipTier === "premium"}
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
            checked={values.agreeToTerms}
            onChange={handleChange}
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
