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
import { useAuth } from '@/context-providers/auth-context-provider';
import { getErrorMessage } from '@/helpers/util/error-utils';
import Button from './nae-button';
import NaeLoader from './nae-loader';
import PanelError from './panel-error';
import toast from 'react-hot-toast';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const GoogleUnlinkConfirmModal = ({ open, onOpenChange, onCancel, onSuccess }:ModalProps) => {

  const [error, setError] = useState('');

  const { user, unlinkGoogle, unlinkingGoogle } = useAuth();

  const clear = () => {
    setError('');
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (unlinkingGoogle) return;
    if (!isOpen) clear();
    onOpenChange(isOpen);
  }

  const handleSubmit = async () => {
    if (!user || unlinkingGoogle) return;

    setError('');

    if (!user.linkedProviders.includes('google')) {
      setError('No Google account was found to unlink');
      return;
    }

    if (user.linkedProviders.length === 1) {
      setError('You must configure another sign in method before removing your Google account');
      return;
    }
    
    try {
      await unlinkGoogle();
      toast.success("Google account unlinked successfully");
      onSuccess();
    } 
    catch (error: unknown) {
      console.error(getErrorMessage(error, "Unable to unlink Google account"));
      setError("There was a problem unlinking your Google account");
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
          <DialogTitle>Unlink Google Account</DialogTitle>
          <DialogDescription>
            You won&apos;t be able to sign in with Google after unlinking. Make sure you have another sign-in method.
          </DialogDescription>
        </DialogHeader>
        {error && <PanelError message={error} />}
        <DialogFooter className='mt-2'>
          <>
            <Button
              onClick={handleCancel}
              disabled={unlinkingGoogle}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={unlinkingGoogle}
              variant="extreme"
              className='gap-2'
            >
              {unlinkingGoogle && <NaeLoader />}
              {unlinkingGoogle ? 'Unlinking...' : 'Unlink'}
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GoogleUnlinkConfirmModal