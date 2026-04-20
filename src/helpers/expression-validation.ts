export const validateEmail = (email: string): boolean => {
  // A common regex pattern for basic email validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

export const excludesSpaces = (value: string): boolean => {
  const expression = /^\S*$/;
  return expression.test(value);
}

export const meetsMinimum = (value: string, min: number): boolean => {
  return value.length >= min;
}

export const validateUsername = (username: string): string => {
  const normalizedUsername = username.trim();

  // enforce no whitespace
  if (!excludesSpaces(normalizedUsername)) {
    throw new Error("Username cannot contain spaces");
  }

  // enforce minimum length
  if (normalizedUsername.length < 4) {
    throw new Error("Username must meet minimum character requirement");
  }

  return normalizedUsername;
}

export const validatePassword = (password: string, confirmPassword: string): string => {
  const normalizedPassword = password.trim();
  const normalizedConfirm = confirmPassword.trim();

  // enforce password confirmation match
  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Passwords do not match");
  }

  // enforce minimum length
  if (normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // enforece no whitespace
  if (!excludesSpaces(normalizedPassword)) {
    throw new Error("Password cannot contain spaces");
  }

  return normalizedPassword;
}