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
  const expression = new RegExp(`^.{${min},}$`);
  return expression.test(value);
}