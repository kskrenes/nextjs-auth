import { InputHTMLAttributes, forwardRef } from 'react';

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label' | 'aria-labelledby'> & {
  instruction?: string;
  id: string;
  autoComplete?: string;
};

type InputProps =
  | (BaseInputProps & { label: string; ['aria-label']?: string; ['aria-labelledby']?: string })
  | (BaseInputProps & { label?: undefined; ['aria-label']: string; ['aria-labelledby']?: string })
  | (BaseInputProps & { label?: undefined; ['aria-label']?: string; ['aria-labelledby']: string });

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { 
      label, 
      instruction = '', 
      id, 
      autoComplete, 
      className = '', 
      ...rest 
    }, 
    ref
  ) => {
    const baseStyles = 'p-2 border border-panel-highlight text-foreground-secondary rounded-lg focus:outline-none focus:border-brand-light';
    const autoCompleteValue = autoComplete || id;
    
    return (
      <div className="flex flex-col gap-2 w-full">

        {(label || instruction) && (
          <div className='flex justify-between items-center'>
            {/* show label top left */}
            {label && <label className='text-lg font-semibold' htmlFor={id}>{label}</label>}
            
            {/* show instruction text top right */}
            {instruction && <p className='text-xs text-foreground-secondary'>{instruction}</p>}
          </div>
        )}
        {/* spread the rest of the props onto the native input element */}
        <input id={id} name={id} autoComplete={autoCompleteValue} className={`${baseStyles} ${className}`} ref={ref} {...rest} />
      </div>
    )
  })

Input.displayName = 'Input';

export default Input;
