'use client';

import { AuthLoginResponse, useAuth } from '@/context-providers/auth-context-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(384); // Default to max-w-sm (384px)

  const handleBackendAuth = useCallback(async (token: string) => {
    if (onLoginAttempt) onLoginAttempt();
    try {
      const res = await loginViaGoogle(token);
      if (callback) callback(res);
      if (redirect && !res.data.mfaRequired) {
        router.replace("/dashboard");
      }
    } catch {
      console.error('Error logging in via Google');
      if (onLoginError) onLoginError();
    }
  }, [loginViaGoogle, callback, onLoginAttempt, onLoginError, redirect, router]);

  // Handle standard tracking of container width changes (Responsive layout)
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Google's button component limits widths between 240px and 400px
        const width = Math.min(Math.max(entry.contentRect.width, 240), 400);
        setContainerWidth(width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const renderGoogleButton = () => {
      if (disposed || !window.google?.accounts) return;

      const targetDiv = document.getElementById('gsi-target-btn');
      if (!targetDiv) return;

      // 1. Initialize to capture the JWT ID Token for your backend POST route
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: google.accounts.id.CredentialResponse) => {
          if (response.credential) {
            handleBackendAuth(response.credential);
          }
        },
      });

      // 2. Render Google's secure button using the dynamically updated container width
      window.google.accounts.id.renderButton(targetDiv, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        logo_alignment: 'center', // Centers the text smoothly inside the boundary
        width: Math.floor(containerWidth), // Passes explicit verified pixel values
      });
    };

    if (window.google?.accounts) {
      renderGoogleButton();
    } else {
      script.addEventListener('load', renderGoogleButton);
    }

    return () => {
      disposed = true;
      script.removeEventListener('load', renderGoogleButton);
    };
    // Re-renders the button correctly if the container container width changes
  }, [handleBackendAuth, containerWidth]);

  return (
    <div 
      ref={containerRef} 
      className='relative w-full max-w-sm mx-auto flex justify-center'
    >
      {/* Target Mount Container */}
      <div 
        id="gsi-target-btn" 
        className={`w-full flex justify-center [&>div]:w-full! [&>div>iframe]:w-[${containerWidth}px]!`}
      ></div>

      {/* Loading & Disabled Overlay mask */}
      {(loggingIn || disabled) && (
        <div className='absolute top-0 left-0 w-full h-full bg-page/80 cursor-not-allowed'></div>
      )}
    </div>
  );
}