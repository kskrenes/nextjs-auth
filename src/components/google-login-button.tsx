'use client';

import { AuthLoginResponse, useAuth } from '@/context-providers/auth-context-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface GoogleLoginButtonProps {
  redirect?: boolean;
  disabled?: boolean;
  callback?: (res: AuthLoginResponse) => void;
  onLoginAttempt?: () => void;
  onLoginError?: () => void;
}

export default function GoogleLoginButton({ 
  redirect = false,
  disabled = false,
  callback,
  onLoginAttempt,
  onLoginError,
 }: GoogleLoginButtonProps) {

  const { loggingIn, loginViaGoogle } = useAuth();
  const router = useRouter();

  const handleBackendAuth = useCallback(async (token: string) => {
    if (onLoginAttempt) {
      onLoginAttempt();
    }
    try {
      const res = await loginViaGoogle(token);
      if (callback) {
        callback(res);
      }
      if (redirect && !res.data.mfaRequired) {
        router.replace("/dashboard");
      }
    } catch {
      console.error('Error logging in via Google');
      if (onLoginError) {
        onLoginError();
      }
    }
  }, [loginViaGoogle, callback, onLoginAttempt, onLoginError, redirect, router]);
  
  useEffect(() => {
    let disposed = false;

    // define a local callback and expose it for cleanup
    const handleCredentialResponseLocal = (response: CredentialResponse) => {
      const idToken = response?.credential;
      if (idToken) {
        handleBackendAuth(idToken);
      }
    };

    // expose to window so the script can call it if needed
    window.handleCredentialResponse = handleCredentialResponseLocal;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // load google script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (disposed) return;

      if (!clientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
        return;
      }

      // ensure button container has not been removed from dom
      const buttonContainer = document.getElementById('gsi-button');
      if (!buttonContainer) return;

      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponseLocal,
      });
      window.google?.accounts.id.renderButton(
        buttonContainer,
        { theme: 'outline', size: 'large' }
      );
    };
    
    return () => {
      disposed = true;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.handleCredentialResponse;
    };
  }, [handleBackendAuth]);

  return (
    <div style={{colorScheme: 'auto'}} className='relative'>
      <div id="gsi-button" data-type="standard"></div>
      {(loggingIn || disabled) && <div className='absolute top-0 left-0 w-full h-full bg-page/80'></div>}
    </div>
  );
}
