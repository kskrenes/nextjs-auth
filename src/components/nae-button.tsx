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
}

const Button: React.FC<ButtonProps> = ({
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  ...rest // Collect any other standard HTML button props
}) => {
  const baseStyles = 'px-6 py-2.5 text-lg font-semibold rounded-lg transition-colors cursor-pointer flex justify-center items-center';
  
  const variantStyles = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 text-white disabled:text-gray-500/50 disabled:cursor-not-allowed'
    : 'bg-gray-200 disabled:bg-gray-600/50 text-gray-700 disabled:text-gray-700 hover:text-blue-600 disabled:cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      className={twMerge(baseStyles, variantStyles, className)}
      {...rest} // Spread the rest of the HTML button attributes
    >
      {children}
    </button>
  );
};

export default Button;
