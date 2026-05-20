'use client';

import { getErrorMessage } from '@/helpers/util/error-utils';
import type { UserDTO } from '@/helpers/dto/user-dto';
import { axiosClient, setupAuthInterceptor } from '@/lib/axios-client';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosResponse } from 'axios';

// Public pages — onSignOut should NOT redirect away from these
const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/verifyemail', '/resetpassword', '/triggerpasswordreset']);

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
  verifyingMFA: boolean;
  login: (email: string, password: string) => Promise<AxiosResponse>;
  loginViaGoogle: (token: string) => Promise<AxiosResponse>
  logout: () => Promise<void>;
  updateUser: (user: EditableProfileFields) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  linkCredentials: (password: string) => Promise<void>;
  enableMFA: (code: string) => Promise<string[]>;
  verifyMFA: (code: string) => Promise<void>;
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
  const [verifyingMFA, setVerifyingMFA] = useState<boolean>(false);

  const router = useRouter();

  // ── wire up interceptor once ─────────────────────────────────────────────────
  // Use a ref so the callback always closes over the latest router/pathname
  // without re-running the interceptor setup on every render.
  const onSignOut = useRef(() => {
    setUser(null);
    setFetchingUser(false);
    // Only redirect to /login if the user is on a protected page.
    // This prevents a jarring redirect when the session expires while the user
    // is already on /login or another public page.
    if (!PUBLIC_PATHS.has(window.location.pathname)) {
      router.replace('/login');
    }
  });

  useEffect(() => {
    // Keep the ref current without re-running setupAuthInterceptor
    onSignOut.current = () => {
      setUser(null);
      setFetchingUser(false);
      if (!PUBLIC_PATHS.has(window.location.pathname)) {
        router.replace('/login');
      }
    };
  });

  useEffect(() => {
    // Register the interceptor exactly once on mount
    const eject = setupAuthInterceptor(() => onSignOut.current());
    return eject; // cleanup on unmount
  }, []);

  // ── initial user fetch ───────────────────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    try {
      const res = await axiosClient.get('/api/users/me');
      setUser(res.data.user);
    } catch {
      // Interceptor already attempted refresh + retry.
      // If we're here, both the access token and the refresh token are invalid.
      setUser(null);
    } finally {
      setFetchingUser(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  // ── auth actions ─────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<AxiosResponse> => {
    setLoggingIn(true);
    try {
      const res = await axiosClient.post("/api/auth/login", { email, password });
      setUser(res.data.user);
      return res;
      // Redirect is handled by the calling page (e.g. LoginPage.useEffect)
    } finally {
      setLoggingIn(false);
    }
  };

  const loginViaGoogle = async (token: string): Promise<AxiosResponse> => {
    setLoggingIn(true);
    try {
      const res = await axiosClient.post('/api/auth/google', { token });
      setUser(res.data.user);
      return res;
      // Redirect handled by client component since it may not be required,
      // for example when linking a Google account on the account page
    } finally {
      setLoggingIn(false);
    }
  }

  const logout = async () => {
    setLoggingOut(true);
    try {
      await axiosClient.post("/api/auth/logout");
      // use browser redirect (instead of app router) to force a full page reload
      // user data is automatically cleared
      window.location.replace('/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } finally {
      setLoggingOut(false);
    }
  };

  const updateUser = async (userData: EditableProfileFields) => {
    setUpdatingUser(true);
    try {
      const res = await axiosClient.post("/api/users/update", userData);
      setUser(res.data.user);
    } finally {
      setUpdatingUser(false);
    }
  };

  const verifyEmail = useCallback(async (token: string) => {
    setVerifyingEmail(true);
    try {
      await axiosClient.post('/api/users/verifyemail', { token });
      // auth sync for signed-in sessions
      try {
        const res = await axiosClient.get('/api/users/me');
        if (res.data?.user) setUser(res.data.user);
      } catch {
        // verification can occur while signed out; ignore auth sync failures here
      }
    } finally {
      setVerifyingEmail(false);
    }
  }, []);

  const linkCredentials = async (password: string) => {
    setLinkingAccount(true);
    try {
      const res = await axiosClient.post("/api/users/linkcredentials", { password });
      setUser(res.data.user);
    } finally {
      setLinkingAccount(false);
    }
  }

  const enableMFA = async (code: string): Promise<string[]> => {
    const res = await axiosClient.post("/api/users/mfa/enable", { code });
    setUser(res.data.user);
    return res.data.backupCodes;
  }

  const verifyMFA = async (code: string) => {
    setVerifyingMFA(true);
    try {
      const res = await axiosClient.post("/api/auth/mfa/verify", { code });
      setUser(res.data.user);
    } finally {
      setVerifyingMFA(false);
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
        verifyingMFA,
        login, 
        loginViaGoogle, 
        logout, 
        updateUser, 
        verifyEmail, 
        linkCredentials, 
        enableMFA,
        verifyMFA,
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
