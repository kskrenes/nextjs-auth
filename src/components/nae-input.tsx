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
    const baseStyles = 'p-2 border text-foreground-secondary rounded-lg focus:outline-none focus:border-brand-light';
    const borderStyle = error ? 'border-error' : 'border-panel-highlight';
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
            {label && <label className='text-base font-semibold' htmlFor={id}>{label}</label>}
            
            {/* show instruction text top right */}
            {instruction && <p className='text-xs text-foreground-secondary'>{instruction}</p>}
          </div>
        )}
        {/* spread the rest of the props onto the native input element */}
        <input 
          id={id} 
          name={id} 
          autoComplete={autoCompleteValue} 
          className={cn(baseStyles, borderStyle, className)} 
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
