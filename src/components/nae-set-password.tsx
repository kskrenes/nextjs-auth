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
        instruction='8 character minimum'
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
    </>
  );
};

export default SetPasswordInputs;
