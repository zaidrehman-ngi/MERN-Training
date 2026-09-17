import { useState } from "react";

function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextValues = {
      ...values,
      [name]: type === "checkbox" ? checked : value,
    };

    setValues(nextValues);
    setErrors(validate(nextValues));
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    setErrors(validate(values));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    setTouched(
      Object.keys(values).reduce((allTouched, field) => {
        allTouched[field] = true;
        return allTouched;
      }, {}),
    );

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== "",
    );

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = Object.values(errors).every((error) => error === "");

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    isSubmitting,
    resetForm,
  };
}

export default useForm;
