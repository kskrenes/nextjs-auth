import { useState, useCallback } from 'react';
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
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected error occurred.');
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

  return {
    loading,
    error,
    fetchPasskeys,
    updatePasskey,
  };
}
