import { useState, useCallback } from 'react';
import { startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import { axiosClient } from '@/lib/axios-client';

export interface Passkey {
  id: string;
  nickname: string;
  createdAt: Date;
  lastUsed: Date;
}

export function usePasskeys() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof WebAuthnError) {
      if (err.name === 'NotAllowedError') {
        setError('The operation was cancelled or timed out. Please try again.');
      } else if (err.name === 'InvalidStateError') {
        setError('This authenticator is already registered for this account.');
      } else {
        setError(`WebAuthn error: ${err.message}`);
      }
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected error occurred during the passkey operation.');
    }
    setLoading(false);
  };

  const fetchPasskeys = useCallback(async (): Promise<Passkey[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/users/passkeys');
      const { success, passkeys } = res.data;
      if (!success) throw new Error('Failed to fetch passkeys');
      setLoading(false);
      return passkeys;
    } catch (err) {
      handleError(err);
      return [];
    }
  }, []);

  const registerPasskey = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Get options from server
      const optionsRes = await axiosClient.post('/api/passkeys/registration/options');
      const { success, options } = optionsRes.data;
      if (!success) throw new Error('Failed to generate registration options');

      // Execute WebAuthn creation ceremony
      const attestationResponse = await startRegistration({ optionsJSON: options });

      // Send response to server for verification
      const verifyRes = await axiosClient.post('/api/passkeys/registration/verify', { attestationResponse });
      if (!verifyRes.data.success) throw new Error('Failed to verify passkey registration');
      setLoading(false);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, []);

  const updatePasskey = useCallback(async (id: string, nickname: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.patch(`/api/users/passkeys/${id}`, { nickname });
      if (!res.data.success) throw new Error('Failed to update passkey');
      setLoading(false);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, []);

  const deletePasskey = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.delete(`/api/users/passkeys/${id}`);
      if (!res.data.success) throw new Error('Failed to delete passkey');
      setLoading(false);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    fetchPasskeys,
    registerPasskey,
    updatePasskey,
    deletePasskey,
  };
}
