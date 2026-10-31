// Client-side copies of the API rules (TRD §9) so users see errors before a round trip.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function registerErrors({ name, email, password }) {
  const errors = {};
  const n = name.trim().length;
  if (n < 2 || n > 60) errors.name = 'Name must be at least 2 and at most 60 characters';
  if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address';
  if (password.length < 8 || password.length > 72) errors.password = 'Password must be at least 8 and at most 72 characters';
  return errors;
}

export function loginErrors({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email';
  if (!password) errors.password = 'Enter your password';
  return errors;
}
