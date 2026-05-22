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
import { axiosClient } from '@/lib/axios-client';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSuccess: (codes: string[] ) => void;
}

const MFABackupCodesModal = ({ open, onOpenChange, onCancel, onSuccess }:ModalProps) => {

  const [code, setCode] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [invalid, setInvalid] = useState<boolean>(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDisabled(true);
      setInvalid(false);
      setCode('');
    }
    if (!validating) {
      onOpenChange(isOpen);
    }
  }

  const handleFormChange = (val: string, disabled: boolean) => {
    setCode(val);
    setDisabled(disabled);
    setInvalid(false);
  }

  const handleVerify = async () => {
    if (validating || disabled || !code) return;

    try {
      setValidating(true);
      const res = await axiosClient.post('/api/users/mfa/backup-codes', { code });
      onSuccess(res.data.backupCodes);
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
          <DialogTitle>Regenerate Backup Codes</DialogTitle>
          <DialogDescription>
            Verify your identity before generating new backup codes. Your existing codes will be invalidated.
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
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MFABackupCodesModal