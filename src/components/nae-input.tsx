import React, { InputHTMLAttributes } from 'react';

/*
  Define the props interface by extending standard HTML input attributes.
  This allows the component to accept all standard input props without 
  explicit declaration, while also allowing custom props.
*/
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string; // Ensure the input has an ID for accessibility (linking label and input)
}

// Use React.FC (Function Component) or the arrow function syntax with the InputProps type.
const Input: React.FC<InputProps> = ({ 
  label, 
  id,
  className = '',
  ...rest 
}) => {
  const baseStyles = 'p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-400';
  return (
    <div className="flex flex-col space-y-2 min-w-[300px]">
      {/* Use the 'htmlFor' attribute to link the label to the input via their IDs */}
      <label className='text-sm' htmlFor={id}>{label}</label>
      {/* Spread the rest of the props onto the native input element */}
      <input id={id} name={id} autoComplete={id} className={`${baseStyles} ${className}`} {...rest} />
    </div>
  );
};

export default Input;
