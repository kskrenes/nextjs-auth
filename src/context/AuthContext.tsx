'use client';

import { getErrorMessage } from '@/helpers/error-message';
import type { UserDTO } from '@/helpers/user-dto';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type EditableProfileFields = {
  username?: string;
  name?: string;
  company?: string;
  website?: string;
  avatarId?: string;
  socialLinks?: string[];
};

export interface AuthContextType {
  user: UserDTO | null;
  fetchingUser: boolean; 
  loggingIn: boolean;
  loggingOut: boolean;
  updatingUser: boolean;
  verifyingEmail: boolean; 
  linkingAccount: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginViaGoogle: (token: string) => Promise<void>
  logout: () => Promise<void>;
  updateUser: (user: EditableProfileFields) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  linkCredentials: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [fetchingUser, setFetchingUser] = useState<boolean>(true);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [updatingUser, setUpdatingUser] = useState<boolean>(false);
  const [verifyingEmail, setVerifyingEmail] = useState<boolean>(false);
  const [linkingAccount, setLinkingAccount] = useState<boolean>(false);

  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoggingIn(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      setUser(res.data.user);
      router.replace("/dashboard");
    } catch (error) {
      throw error;
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await axios.post("/api/auth/logout");
      // use browser redirect (instead of app router) to force a full page reload
      // user data is automatically cleared
      window.location.replace('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } finally {
      setLoggingOut(false);
    }
  };

  const updateUser = async (userData: EditableProfileFields) => {
    setUpdatingUser(true);
    try {
      const res = await axios.post("/api/users/update", userData);
      setUser(res.data.user);
    } catch (error) {
      throw error;
    } finally {
      setUpdatingUser(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setVerifyingEmail(true);
    try {
      await axios.post('/api/users/verifyemail', { token });
      // auth sync for signed-in sessions
      try {
        const res = await axios.get('/api/users/me');
        if (res.data?.user) setUser(res.data.user);
      } catch {
        // verification can occur while signed out; ignore auth sync failures here
      }
    } catch (error) {
      throw error;
    } finally {
      setVerifyingEmail(false);
    }
  };

  const loginViaGoogle = async (token: string) => {
    setLoggingIn(true);
    try {
      const res = await axios.post('/api/auth/google', { token });
      setUser(res.data.user);
    } catch (error) {
      throw error;      
    } finally {
      setLoggingIn(false);
    }
  }

  const linkCredentials = async (password: string) => {
    setLinkingAccount(true);
    try {
      const res = await axios.post("/api/users/linkcredentials", { password });
      setUser(res.data.user);
    } catch (error) {
      throw error;
    } finally {
      setLinkingAccount(false);
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        fetchingUser, 
        loggingIn,
        loggingOut,
        updatingUser,
        verifyingEmail, 
        linkingAccount,
        login, 
        loginViaGoogle, 
        logout, 
        updateUser, 
        verifyEmail, 
        linkCredentials, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
