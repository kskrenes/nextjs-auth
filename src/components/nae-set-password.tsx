import React from 'react';
import Input from './nae-input';

// Define the props interface.
interface SetPasswordInputsProps {
  label: string;
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  idPrefix?: string;
}

// Use React.FC (Function Component) or the arrow function syntax with the InputProps type.
const SetPasswordInputs: React.FC<SetPasswordInputsProps> = ({ 
  label,
  password, 
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  idPrefix = '',
}) => {

  const passwordId = idPrefix ? `${idPrefix}-password-input` : 'password-input';
  const confirmId = idPrefix ? `${idPrefix}-confirm-password-input` : 'confirm-password-input';
  
  return (
    <>
      <Input 
        id={passwordId}
        label={label}
        type="password"
        instruction='8 character minimum, no spaces'
        minLength={8}
        required
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <Input 
        id={confirmId}
        label={`Confirm ${label}`}
        type="password"
        minLength={8}
        required
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
      />
    </>
  );
};

export default SetPasswordInputs;
