export function assertPasswordConfirmation(
  password: string,
  confirmPassword: string
): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}
