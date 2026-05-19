import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'extreme';
type Size = 'standard' | 'small';

const variantMap: Record<Variant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  tertiary: 'button-tertiary',
  warning: 'button-warning',
  extreme: 'button-extreme',
};

const sizeMap: Record<Size, string> = {
  standard: 'button-standard',
  small: 'button-small',
};

/*
  Define the props interface by extending standard HTML button attributes.
  This allows the component to accept all standard button props without 
  explicit declaration, while also allowing custom props.
*/
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;  // The content inside the button
  variant?: Variant;    // Optional custom styling
  size?: Size;          // Optional size styling
}

const Button: React.FC<ButtonProps> = ({
  children, 
  variant = 'primary', 
  size = 'standard',
  onClick,   
  className = '',
  ...rest // Collect any other standard HTML button props
}) => {
  
  const variantStyles = variantMap[variant] ?? 'button-primary';
  const sizeStyles = sizeMap[size] ?? 'button-standard';

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
