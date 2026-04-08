import React, { InputHTMLAttributes } from 'react';

/*
  Define the props interface by extending standard HTML input attributes.
  This allows the component to accept all standard input props without 
  explicit declaration, while also allowing custom props.
*/
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  instruction?: string;
  id: string; // Ensure the input has an ID for accessibility (linking label and input)
  autoComplete?: string;
}

// Use React.FC (Function Component) or the arrow function syntax with the InputProps type.
const Input: React.FC<InputProps> = ({
  label, 
  instruction = '',
  id,
  autoComplete,
  className = '',
  ...rest 
}) => {
  const baseStyles = 'p-2 border border-gray-700 text-gray-400 rounded-lg focus:outline-none focus:border-indigo-400';
  const autoCompleteValue = autoComplete || id;
  return (
    <div className="flex flex-col gap-2 min-w-[300px] w-full">

      {(label || instruction) && (
        <div className='flex justify-between items-center'>
          {/* show label top left */}
          {label && <label className='text-lg font-semibold' htmlFor={id}>{label}</label>}
          
          {/* show instruction text top right */}
          {instruction && <p className='text-xs text-gray-400'>{instruction}</p>}
        </div>
      )}
      {/* spread the rest of the props onto the native input element */}
      <input id={id} name={id} autoComplete={autoCompleteValue} className={`${baseStyles} ${className}`} {...rest} />
    </div>
  );
};

export default Input;
