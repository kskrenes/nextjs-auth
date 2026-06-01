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

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_MIN_WIDTH = 240;
const GSI_MAX_WIDTH = 400;
const RESIZE_DEBOUNCE_MS = 150;

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
  const [containerWidth, setContainerWidth] = useState<number>(GSI_MAX_WIDTH);

  // Refs that stay stable across renders without triggering re-initialization
  const containerWidthRef = useRef<number>(GSI_MAX_WIDTH);
  const initializedRef = useRef<boolean>(false);
  const callbackRef = useRef<typeof handleBackendAuth | null>(null);

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

  // Keep callbackRef current on every render so the GSI callback always
  // calls the latest version without re-running the initialization effect.
  useEffect(() => {
    callbackRef.current = handleBackendAuth;
  });

  // Track container width with a debounced ResizeObserver.
  // The debounce prevents excessive renderButton calls during window resizing.
  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const clamped = Math.min(
          Math.max(Math.floor(entry.contentRect.width), GSI_MIN_WIDTH),
          GSI_MAX_WIDTH,
        );
        containerWidthRef.current = clamped;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => setContainerWidth(clamped), RESIZE_DEBOUNCE_MS);
      }
    });

    observer.observe(containerRef.current);
    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  // Load the GSI script and call initialize exactly once.
  // initializedRef is intentionally NOT reset in the cleanup so that
  // React Strict Mode's double-invoke of effects does not trigger a second
  // initialize call (which would produce the [GSI_LOGGER] warning).
  useEffect(() => {
    if (initializedRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return;
    }

    const initAndRender = () => {
      if (!window.google?.accounts) return;

      const targetDiv = document.getElementById('gsi-target-btn');
      if (!targetDiv) return;

      // Mark as initialized before the call so any re-entrant invocation is a no-op
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        // Use callbackRef so this closure never goes stale, even when
        // React recreates handleBackendAuth due to dependency changes.
        callback: (response: google.accounts.id.CredentialResponse) => {
          if (response.credential) {
            callbackRef.current?.(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(targetDiv, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        logo_alignment: 'center',
        width: containerWidthRef.current,
      });
    };

    let script = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if (window.google?.accounts) {
      initAndRender();
    } else {
      script.addEventListener('load', initAndRender);
    }

    return () => {
      (script as HTMLScriptElement).removeEventListener('load', initAndRender);
      // Note: initializedRef is NOT reset here — see comment above.
    };
  }, []);

  // Re-render the button whenever the debounced container width changes.
  // initialize is NOT called again here; only the visual button is updated.
  useEffect(() => {
    if (!initializedRef.current || !window.google?.accounts) return;

    const targetDiv = document.getElementById('gsi-target-btn');
    if (!targetDiv) return;

    window.google.accounts.id.renderButton(targetDiv, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      logo_alignment: 'center',
      width: containerWidth,
    });
  }, [containerWidth]);

  return (
    <div
      ref={containerRef}
      className='relative w-full max-w-sm mx-auto flex justify-center'
    >
      {/* Target Mount Container */}
      <div id="gsi-target-btn"></div>

      {/* Loading & Disabled Overlay mask */}
      {(loggingIn || disabled) && (
        <div className='absolute top-0 left-0 w-full h-full bg-page/80 cursor-not-allowed'></div>
      )}
    </div>
  );
}
