import { defaultTheme } from '@/helpers/themes';
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
  const baseStyles = 'px-6 py-2.5 text-lg font-semibold rounded-md transition-colors cursor-pointer flex justify-center items-center';
  
  const variantStyles = variant === 'primary'
    ? 'bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-900/50 text-[#e5e6f2] disabled:text-gray-500/50 disabled:cursor-not-allowed'
    : 'bg-indigo-500/0 hover:bg-indigo-600 disabled:bg-gray-600/50 border-2 border-indigo-500 hover:border-indigo-600 text-[#e5e6f2] disabled:text-gray-700 hover:text-white disabled:cursor-not-allowed';

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
