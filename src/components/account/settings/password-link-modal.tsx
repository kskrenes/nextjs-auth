"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/dialog';
import { useAuth } from '@/context-providers/auth-context-provider';
import { getValidPassword } from '@/helpers/util/form-validation-utils';
import PanelError from '@/components/panel-error';
import SetPasswordInputs from '@/components/nae-set-password';
import Button from '@/components/nae-button';
import NaeLoader from '@/components/nae-loader';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const PasswordLinkModal = ({ open, onOpenChange, onCancel, onSuccess }:ModalProps) => {

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { linkCredentials } = useAuth();

  const handleOpenChange = (isOpen: boolean) => {
    if (submitting) return;
    if (!isOpen) clear();
    onOpenChange(isOpen);
  }

  const clear = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  const handleSubmit = async () => {
    if (submitting) return;

    setError('');

    if (!password || !confirmPassword) {
      setError("Please enter and confirm a password");
      return;
    }

    let validPassword;
    try {
      validPassword = getValidPassword(password, confirmPassword);
    } catch (error: unknown) {
      setError((error as Error).message);
      return;
    }
    
    try {
      // add password via auth context
      setSubmitting(true);
      await linkCredentials(validPassword);
      clear();
      onSuccess();
    } 
    catch {
      setError("There was a problem adding a password to your account");
    }
    finally {
      setSubmitting(false);
    }
  }

  const handleCancel = () => {
    clear();
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Password</DialogTitle>
          <DialogDescription>
            Add a password to enable login with email and password credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && <PanelError message={error} />}

          <SetPasswordInputs
            label="Password"
            password={password}
            confirmPassword={confirmPassword}
            onEnter={handleSubmit}
            onPasswordChange={(val) => {
              setPassword(val);
              if (error) setError('');
            }}
            onConfirmPasswordChange={(val) => {
              setConfirmPassword(val);
              if (error) setError('');
            }}
          />
        </div>

        <DialogFooter className='mt-2'>
          <>
            <Button
              onClick={handleCancel}
              disabled={submitting}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button 
              size="small"
              onClick={handleSubmit}
              disabled={submitting}
              className='button-loader'
            >
              {submitting && <NaeLoader />}
              {submitting ? 'Adding Password...' : 'Add Password'}
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordLinkModal