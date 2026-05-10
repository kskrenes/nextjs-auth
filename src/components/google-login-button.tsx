'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface GoogleLoginButtonProps {
  redirect?: boolean;
  callback?: () => void;
}

export default function GoogleLoginButton({ 
  redirect = false,
  callback,
 }: GoogleLoginButtonProps) {

  const { loggingIn, loginViaGoogle } = useAuth();
  const router = useRouter();

  const handleBackendAuth = useCallback(async (token: string) => {
    try {
      await loginViaGoogle(token);
      if (callback) {
        callback();
      }
      if (redirect) {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error('Error logging in via Google', error);
    }
  }, [loginViaGoogle, callback, redirect, router]);
  
  useEffect(() => {
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
      if (!clientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
        return;
      }

      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponseLocal,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('gsi-button')!,
        { theme: 'outline', size: 'large' }
      );
    };
    
    return () => {
      document.body.removeChild(script);
      delete window.handleCredentialResponse;
    };
  }, [handleBackendAuth]);

  return (
    <div style={{colorScheme: 'auto'}} className='relative'>
      <div id="gsi-button" data-type="standard"></div>
      {loggingIn && <div className='absolute top-0 left-0 w-full h-full bg-page/80'></div>}
    </div>
  );
}
