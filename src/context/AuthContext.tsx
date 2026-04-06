'use client';

import { getErrorMessage } from '@/helpers/error-message';
import NaeUser from '@/models/user-interface';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type EditableProfileFields = {
  name?: string;
  company?: string;
  website?: string;
  avatarId?: string;
  socialLinks?: string[];
};

export interface AuthContextType {
  user: NaeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: EditableProfileFields) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<NaeUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/users/login", { email, password });
      setUser(res.data.user);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axios.post("/api/users/logout");
      setUser(null);
      router.push("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: EditableProfileFields) => {
    try {
      const res = await axios.post("/api/users/update", userData);
      setUser(res.data.user);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
