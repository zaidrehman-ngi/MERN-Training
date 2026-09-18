## useForm

A reusable custom Hook for managing form values, validation, touched fields, submission, and reset behaviour.

### API

#### Inputs

| Input           | Purpose                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `initialValues` | The initial values for all form fields.                                                                               |
| `validate`      | A function that receives the current values and returns validation errors. The form provides the rules, not the hook. |
| `onSubmit`      | A function called with the form values when the form passes validation.                                               |

#### Returns

| Item           | Purpose                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `values`       | The current values of all form fields.                                     |
| `errors`       | Validation errors for the current form values.                             |
| `touched`      | Tracks which fields the user has interacted with.                          |
| `handleChange` | Updates a field value when its input changes.                              |
| `handleBlur`   | Marks a field as touched when the user leaves it.                          |
| `handleSubmit` | Handles form submission, runs validation, and calls `onSubmit` when valid. |
| `isValid`      | Indicates whether the current form values pass validation.                 |
| `isSubmitting` | Indicates whether the form is currently being submitted.                   |
| `resetForm`    | Resets the form values, errors, and touched state to their initial state.  |

### Example

```text
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
```