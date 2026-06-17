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
import Button from '@/components/nae-button';
import NaeLoader from '@/components/nae-loader';
import PanelError from '@/components/panel-error';
import toast from 'react-hot-toast';
import { axiosClient } from '@/lib/axios-client';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const SignOutAllDevicesConfirmModal = ({ open, onOpenChange, onCancel, onSuccess }:ModalProps) => {

  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const clear = () => {
    setError('');
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (pending) return;
    if (!isOpen) clear();
    onOpenChange(isOpen);
  }

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    try {
      const response = await axiosClient.post("/api/auth/logout-all");
      const count = response.data.deletedCount;
      toast.success(`Signed out of ${count} device${count > 1 ? 's' : ''}`);
      clear();
      onSuccess();
    } catch (error) {
      console.error("Failed to sign out of all devices:", error);
      setError("Failed to sign out of all devices");
    } finally {
      setPending(false);
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
          <DialogTitle>Sign Out All Devices</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out all devices? You will be signed out from your current session.
          </DialogDescription>
        </DialogHeader>
        {error && <PanelError message={error} />}
        <DialogFooter className='mt-2'>
          <>
            <Button
              onClick={handleCancel}
              disabled={pending}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={pending}
              variant="extreme"
              className="button-loader"
            >
              {pending && <NaeLoader />}
              {pending ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SignOutAllDevicesConfirmModal