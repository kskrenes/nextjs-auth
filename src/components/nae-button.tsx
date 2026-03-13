import React, { ButtonHTMLAttributes, ReactNode } from 'react';

/*
  Define the props interface by extending standard HTML button attributes.
  This allows the component to accept all standard button props without 
  explicit declaration, while also allowing custom props.
*/
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;  // The content inside the button
  variant?:             // Optional custom styling
    'primary' | 'secondary';  
  onClick?:             // Optional click handler.
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Button: React.FC<ButtonProps> = ({
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  ...rest // Collect any other standard HTML button props
}) => {
  const baseStyles = 'py-2 text-lg rounded-xl font-semibold transition-colors cursor-pointer';
  
  const variantStyles = variant === 'primary'
    ? 'bg-purple-900 hover:bg-purple-800 disabled:bg-purple-900/50 disabled:text-gray-500/50 disabled:cursor-default'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...rest} // Spread the rest of the HTML button attributes
    >
      {children}
    </button>
  );
};

export default Button;
