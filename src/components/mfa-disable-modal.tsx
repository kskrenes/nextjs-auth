"use client";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import MFAVerifyControls from './mfa-verify-controls';
import MFAVerifyForm from './mfa-verify-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context-providers/auth-context-provider';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const MFADisableModal = ({ open, onOpenChange, onCancel, onSuccess }:ModalProps) => {

  const [code, setCode] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [invalid, setInvalid] = useState<boolean>(false);

  const { disableMFA } = useAuth();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setDisabled(true);
    if (!validating) onOpenChange(isOpen);
  }

  const handleFormChange = (val: string, disabled: boolean) => {
    console.log('form change:', val);
    setCode(val);
    setDisabled(disabled);
    setInvalid(false);
  }

  const handleVerify = async () => {
    if (validating) return;

    try {
      setValidating(true);
      console.log('code:', code);
      await disableMFA(code);
      onSuccess();
    } catch (error) {
      if (axios.isAxiosError(error) && [400, 401].includes(error.response?.status ?? 0)) {
        setInvalid(true);
      } else {
        toast.error("There was an error validating the code");
      }
    } finally {
      setValidating(false);
    }
  }

  const handleCancel = () => {
    setDisabled(true);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Verify your identity before disabling two-factor authentication. This will make your account less secure.
          </DialogDescription>
        </DialogHeader>

        <MFAVerifyForm 
          onChange={handleFormChange}
          onVerify={handleVerify}
          loading={validating}
          invalid={invalid}
        />

        <DialogFooter>
          <MFAVerifyControls 
            onCancel={handleCancel}
            onVerify={handleVerify}
            loading={validating} 
            disabled={disabled} 
            danger={true}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MFADisableModal