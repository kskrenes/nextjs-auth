import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/*
  Define the props interface by extending standard HTML button attributes.
  This allows the component to accept all standard button props without 
  explicit declaration, while also allowing custom props.
*/
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;  // The content inside the button
  variant?:             // Optional custom styling
    'primary' | 'secondary';
  size?:                // Optional size styling
    'standard' | 'small';
}

const Button: React.FC<ButtonProps> = ({
  children, 
  variant = 'primary', 
  size = 'standard',
  onClick, 
  className = '',
  ...rest // Collect any other standard HTML button props
}) => {
  
  const variantStyles = variant === 'primary'
    ? 'button-primary'
    : 'button-secondary';

  const sizeStyles = size === 'standard'
    ? 'button-standard'
    : 'button-small';

  return (
    <button
      onClick={onClick}
      className={twMerge(variantStyles, sizeStyles, className)}
      {...rest} // Spread the rest of the HTML button attributes
    >
      {children}
    </button>
  );
};

export default Button;
