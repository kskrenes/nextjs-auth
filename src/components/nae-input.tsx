import { cn } from '@/helpers/util/classname-util';
import Link from 'next/link';
import { InputHTMLAttributes, KeyboardEvent, forwardRef } from 'react';

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label' | 'aria-labelledby'> & {
  id: string;
  instruction?: string;
  link?: {
    label: string;
    href: string;
  };
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
      id, 
      label, 
      instruction = '', 
      link = null,
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
      <div className="flex flex-col gap-1 w-full">

        {(label || instruction || link) && (
          <div className='flex justify-between items-center'>
            {/* show label top left */}
            {label && <label className='input-label' htmlFor={id}>{label}</label>}
            
            {/* show instruction text top right */}
            {instruction && <p className='input-instruction'>{instruction}</p>}

            {/* show button top right */}
            {link && (
              <Link 
                href={link.href}
                className="input-link"
              >
                {link.label}
              </Link>
            )}
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
