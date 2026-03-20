import React from 'react';
import Input from './nae-input';

// Define the props interface.
interface SetPasswordInputsProps {
  label: string;
  password: string;
  confirmPassword: string;
  onPasswordChange: Function;
  onConfirmPasswordChange: Function;
}

// Use React.FC (Function Component) or the arrow function syntax with the InputProps type.
const SetPasswordInputs: React.FC<SetPasswordInputsProps> = ({ 
  label,
  password, 
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  
  return (
    <>
      <Input 
        id="password-input" 
        label={label}
        type="password"
        required
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <Input 
        id="confirm-password-input" 
        label={`Confirm ${label}`}
        type="password"
        required
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
      />
      <label className='text-xs text-center'>
        Password must be at least 8 characters,<br/>and can contain letters, numbers, and symbols.
      </label>
    </>
  );
};

export default SetPasswordInputs;
