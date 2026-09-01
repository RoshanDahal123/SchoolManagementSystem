export const validateStudent = (values: Record<string, string>) => {
  const errors: Record<string, string> = {};

  if (!values.name) {
    errors.name = 'Name is required';
  }

  if (!values.email) {
    errors.email = 'Email is required';
  }

  return errors;
};
