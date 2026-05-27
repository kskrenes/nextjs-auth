import { cn } from '@/helpers/util/classname-util';
import { InputHTMLAttributes, KeyboardEvent, forwardRef } from 'react';

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label' | 'aria-labelledby'> & {
  instruction?: string;
  id: string;
  autoComplete?: string;
  error?: boolean;
  onEnter?: () => void;
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
      error = false,
      onEnter = undefined,
      onKeyDown,
      ...rest 
    }, 
    ref
  ) => {
    const style = error ? 'input-error' : 'input-standard';
    const autoCompleteValue = autoComplete || id;

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (onEnter && e.key === 'Enter') {
        onEnter();
      }
    }
    
    return (
      <div className="flex flex-col gap-2 w-full">

        {(label || instruction) && (
          <div className='flex justify-between items-center'>
            {/* show label top left */}
            {label && <label className='input-label' htmlFor={id}>{label}</label>}
            
            {/* show instruction text top right */}
            {instruction && <p className='input-instruction'>{instruction}</p>}
          </div>
        )}
        {/* spread the rest of the props onto the native input element */}
        <input 
          id={id} 
          name={id} 
          autoComplete={autoCompleteValue} 
          aria-invalid={error || undefined}
          className={cn(style, className)} 
          ref={ref} 
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (!e.defaultPrevented) handleKeyDown(e);
          }}
          {...rest} 
        />
      </div>
    )
  })

Input.displayName = 'Input';

export default Input;
